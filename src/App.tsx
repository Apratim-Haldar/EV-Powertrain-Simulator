import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, Settings as SettingsIcon } from 'lucide-react';
import { SimulationEngine, SimulationConfig, SimulationDataPoint } from './simulation/SimulationEngine';
import { DrivingCycles } from './models/DrivingCycles';
import { Gauge } from './components/Gauge';
import { LineChart } from './components/LineChart';
import { EnergyFlowDiagram } from './components/EnergyFlowDiagram';
import { supabase } from './lib/supabase';

type VehicleType = 'scooter' | '3w_cargo' | 'passenger_ev';
type DrivingCycleType = 'NEDC' | 'WLTP' | 'URBAN' | 'HIGHWAY';

interface VehiclePreset {
  name: string;
  battery: { capacity: number; voltage: number; maxCurrent: number };
  motor: { maxPower: number; maxTorque: number; maxSpeed: number };
  vehicle: { mass: number; frontalArea: number; dragCoeff: number; regenEfficiency: number };
}

const vehiclePresets: Record<VehicleType, VehiclePreset> = {
  scooter: {
    name: 'Electric Scooter',
    battery: { capacity: 3.0, voltage: 48, maxCurrent: 50 },
    motor: { maxPower: 3.5, maxTorque: 150, maxSpeed: 5000 },
    vehicle: { mass: 150, frontalArea: 0.8, dragCoeff: 0.7, regenEfficiency: 0.75 },
  },
  '3w_cargo': {
    name: '3-Wheeler Cargo',
    battery: { capacity: 8.0, voltage: 72, maxCurrent: 100 },
    motor: { maxPower: 8.0, maxTorque: 200, maxSpeed: 4500 },
    vehicle: { mass: 600, frontalArea: 2.2, dragCoeff: 0.6, regenEfficiency: 0.7 },
  },
  passenger_ev: {
    name: 'Passenger EV',
    battery: { capacity: 50, voltage: 400, maxCurrent: 300 },
    motor: { maxPower: 100, maxTorque: 300, maxSpeed: 12000 },
    vehicle: { mass: 1500, frontalArea: 2.5, dragCoeff: 0.28, regenEfficiency: 0.8 },
  },
};

function App() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('scooter');
  const [drivingCycle, setDrivingCycle] = useState<DrivingCycleType>('URBAN');
  const [isRunning, setIsRunning] = useState(false);
  const [currentDataPoint, setCurrentDataPoint] = useState<SimulationDataPoint | null>(null);
  const [allDataPoints, setAllDataPoints] = useState<SimulationDataPoint[]>([]);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);

  const engineRef = useRef<SimulationEngine | null>(null);
  const animationRef = useRef<number>();

  const createSimulationEngine = () => {
    const preset = vehiclePresets[vehicleType];
    const config: SimulationConfig = {
      battery: {
        capacity: preset.battery.capacity,
        nominalVoltage: preset.battery.voltage,
        initialSoC: 100,
        maxCurrent: preset.battery.maxCurrent,
        internalResistance: 0.05,
      },
      motor: {
        maxPower: preset.motor.maxPower,
        maxTorque: preset.motor.maxTorque,
        maxSpeed: preset.motor.maxSpeed,
        efficiency: 0.92,
        motorType: 'BLDC',
      },
      vehicle: {
        mass: preset.vehicle.mass,
        frontalArea: preset.vehicle.frontalArea,
        dragCoefficient: preset.vehicle.dragCoeff,
        rollingResistanceCoeff: 0.015,
        wheelRadius: 0.3,
        regenEfficiency: preset.vehicle.regenEfficiency,
      },
      drivingCycle: DrivingCycles[drivingCycle],
      timeStep: 0.1,
    };

    return new SimulationEngine(config);
  };

  const startSimulation = () => {
    if (!engineRef.current) {
      engineRef.current = createSimulationEngine();
    }
    setIsRunning(true);
    setSimulationResults(null);
  };

  const pauseSimulation = () => {
    setIsRunning(false);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    engineRef.current = createSimulationEngine();
    setCurrentDataPoint(null);
    setAllDataPoints([]);
    setSimulationResults(null);
  };

  const saveSimulation = async () => {
    if (!simulationResults || allDataPoints.length === 0) return;

    const preset = vehiclePresets[vehicleType];

    try {
      const { data: simRun, error: simError } = await supabase
        .from('simulation_runs')
        .insert({
          vehicle_type: vehicleType,
          driving_cycle: drivingCycle,
          battery_capacity: preset.battery.capacity,
          motor_power: preset.motor.maxPower,
          vehicle_mass: preset.vehicle.mass,
          regen_efficiency: preset.vehicle.regenEfficiency,
          total_distance: simulationResults.totalDistance,
          energy_consumed: simulationResults.energyConsumed,
          energy_recovered: simulationResults.energyRecovered,
          final_soc: simulationResults.finalSoC,
          avg_efficiency: simulationResults.avgEfficiency,
        })
        .select()
        .single();

      if (simError) throw simError;

      const dataToInsert = allDataPoints.map((dp) => ({
        simulation_id: simRun.id,
        time: dp.time,
        speed: dp.speed,
        acceleration: dp.acceleration,
        motor_torque: dp.motorTorque,
        motor_power: dp.motorPower,
        battery_soc: dp.batterySoC,
        battery_current: dp.batteryCurrent,
        energy_flow: dp.energyFlow,
        is_regenerating: dp.isRegenerating,
      }));

      const { error: dataError } = await supabase
        .from('simulation_data_points')
        .insert(dataToInsert);

      if (dataError) throw dataError;

      alert('Simulation saved successfully!');
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Failed to save simulation');
    }
  };

  useEffect(() => {
    if (!isRunning || !engineRef.current) return;

    const animate = () => {
      if (!engineRef.current) return;

      const maxTime = DrivingCycles[drivingCycle][DrivingCycles[drivingCycle].length - 1].time;

      if (engineRef.current.getCurrentTime() >= maxTime) {
        const results = engineRef.current.getResults();
        setSimulationResults(results);
        setIsRunning(false);
        return;
      }

      const dataPoint = engineRef.current.step();
      setCurrentDataPoint(dataPoint);
      setAllDataPoints((prev) => [...prev, dataPoint]);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, drivingCycle]);

  const preset = vehiclePresets[vehicleType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <SettingsIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">EV Powertrain Simulator</h1>
                <p className="text-sm text-slate-300">Real-time Mechatronic Simulation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Configuration</h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <SettingsIcon className="h-5 w-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => {
                      setVehicleType(e.target.value as VehicleType);
                      resetSimulation();
                    }}
                    disabled={isRunning}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-100"
                  >
                    <option value="scooter">Electric Scooter</option>
                    <option value="3w_cargo">3-Wheeler Cargo</option>
                    <option value="passenger_ev">Passenger EV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Driving Cycle
                  </label>
                  <select
                    value={drivingCycle}
                    onChange={(e) => {
                      setDrivingCycle(e.target.value as DrivingCycleType);
                      resetSimulation();
                    }}
                    disabled={isRunning}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-100"
                  >
                    <option value="NEDC">NEDC</option>
                    <option value="WLTP">WLTP</option>
                    <option value="URBAN">Urban</option>
                    <option value="HIGHWAY">Highway</option>
                  </select>
                </div>

                {showSettings && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-600">Battery</p>
                      <p className="text-sm text-slate-900">{preset.battery.capacity} kWh</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">Motor Power</p>
                      <p className="text-sm text-slate-900">{preset.motor.maxPower} kW</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">Vehicle Mass</p>
                      <p className="text-sm text-slate-900">{preset.vehicle.mass} kg</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">Regen Efficiency</p>
                      <p className="text-sm text-slate-900">
                        {(preset.vehicle.regenEfficiency * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {!isRunning ? (
                  <button
                    onClick={startSimulation}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    <span>Start Simulation</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseSimulation}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Pause className="h-5 w-5" />
                    <span>Pause</span>
                  </button>
                )}

                <button
                  onClick={resetSimulation}
                  disabled={isRunning}
                  className="w-full bg-slate-500 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span>Reset</span>
                </button>

                {simulationResults && (
                  <button
                    onClick={saveSimulation}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Save className="h-5 w-5" />
                    <span>Save to Database</span>
                  </button>
                )}
              </div>
            </div>

            {simulationResults && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Results</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-600">Distance</p>
                    <p className="text-lg font-bold text-slate-900">
                      {simulationResults.totalDistance.toFixed(2)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Energy Consumed</p>
                    <p className="text-lg font-bold text-slate-900">
                      {simulationResults.energyConsumed.toFixed(2)} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Energy Recovered</p>
                    <p className="text-lg font-bold text-green-600">
                      {simulationResults.energyRecovered.toFixed(2)} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Regeneration %</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {simulationResults.regenerationPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Efficiency</p>
                    <p className="text-lg font-bold text-slate-900">
                      {simulationResults.avgEfficiency.toFixed(0)} Wh/km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Final SoC</p>
                    <p className="text-lg font-bold text-slate-900">
                      {simulationResults.finalSoC.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {currentDataPoint && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <Gauge
                    value={currentDataPoint.speed}
                    max={120}
                    label="Speed"
                    unit="km/h"
                    color="text-blue-500"
                  />
                  <Gauge
                    value={currentDataPoint.batterySoC}
                    max={100}
                    label="Battery SoC"
                    unit="%"
                    color="text-green-500"
                  />
                  <Gauge
                    value={currentDataPoint.motorPower}
                    max={preset.motor.maxPower}
                    label="Motor Power"
                    unit="kW"
                    color="text-amber-500"
                  />
                  <Gauge
                    value={Math.abs(currentDataPoint.batteryPower)}
                    max={preset.motor.maxPower * 1.2}
                    label="Battery Power"
                    unit="kW"
                    color="text-rose-500"
                  />
                </div>

                <EnergyFlowDiagram
                  batterySoC={currentDataPoint.batterySoC}
                  batteryPower={currentDataPoint.batteryPower}
                  motorPower={currentDataPoint.motorPower}
                  isRegenerating={currentDataPoint.isRegenerating}
                  speed={currentDataPoint.speed}
                />

                <div className="grid grid-cols-2 gap-6">
                  <LineChart
                    data={allDataPoints.map((dp) => ({ x: dp.time, y: dp.speed }))}
                    label="Speed Profile"
                    xLabel="Time (s)"
                    yLabel="Speed (km/h)"
                    color="#3b82f6"
                    height={250}
                  />
                  <LineChart
                    data={allDataPoints.map((dp) => ({ x: dp.time, y: dp.batterySoC }))}
                    label="Battery State of Charge"
                    xLabel="Time (s)"
                    yLabel="SoC (%)"
                    color="#10b981"
                    height={250}
                  />
                  <LineChart
                    data={allDataPoints.map((dp) => ({ x: dp.time, y: dp.motorPower }))}
                    label="Motor Power"
                    xLabel="Time (s)"
                    yLabel="Power (kW)"
                    color="#f59e0b"
                    height={250}
                  />
                  <LineChart
                    data={allDataPoints.map((dp) => ({ x: dp.time, y: dp.energyFlow }))}
                    label="Energy Flow"
                    xLabel="Time (s)"
                    yLabel="Power (kW)"
                    color="#ef4444"
                    height={250}
                  />
                </div>
              </>
            )}

            {!currentDataPoint && (
              <div className="bg-white p-12 rounded-xl shadow-lg border border-slate-200 text-center">
                <div className="max-w-md mx-auto">
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Ready to Simulate
                  </h3>
                  <p className="text-slate-600">
                    Configure your vehicle and driving cycle, then click "Start Simulation"
                    to begin the real-time powertrain simulation with regenerative braking.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
