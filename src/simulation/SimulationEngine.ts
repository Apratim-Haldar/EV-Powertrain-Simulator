import { BatterySystem, BatteryConfig } from '../models/BatterySystem';
import { ElectricMotor, MotorConfig } from '../models/ElectricMotor';
import { VehicleDynamics, VehicleConfig } from '../models/VehicleDynamics';
import { DrivingCyclePoint, interpolateSpeed } from '../models/DrivingCycles';

export interface SimulationConfig {
  battery: BatteryConfig;
  motor: MotorConfig;
  vehicle: VehicleConfig;
  drivingCycle: DrivingCyclePoint[];
  timeStep: number;
}

export interface SimulationDataPoint {
  time: number;
  speed: number;
  targetSpeed: number;
  acceleration: number;
  motorTorque: number;
  motorPower: number;
  motorEfficiency: number;
  batterySoC: number;
  batteryCurrent: number;
  batteryPower: number;
  energyFlow: number;
  isRegenerating: boolean;
  distance: number;
}

export class SimulationEngine {
  private battery: BatterySystem;
  private motor: ElectricMotor;
  private vehicle: VehicleDynamics;
  private config: SimulationConfig;
  private dataPoints: SimulationDataPoint[] = [];
  private currentTime: number = 0;
  private totalEnergyConsumed: number = 0;
  private totalEnergyRecovered: number = 0;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.battery = new BatterySystem(config.battery);
    this.motor = new ElectricMotor(config.motor);
    this.vehicle = new VehicleDynamics(config.vehicle);
  }

  step(): SimulationDataPoint {
    const targetSpeed = interpolateSpeed(this.config.drivingCycle, this.currentTime);
    const currentSpeed = this.vehicle.getState().speed;

    const speedError = targetSpeed - currentSpeed;
    const isRegenerating = speedError < -1 && currentSpeed > 5;

    let requestedPower: number;
    if (isRegenerating) {
      requestedPower = -Math.min(
        this.config.motor.maxPower * 0.7,
        Math.abs(speedError) * this.config.vehicle.mass * 2
      );
    } else {
      requestedPower = Math.max(
        0,
        speedError * this.config.vehicle.mass * 5 + this.vehicle.getState().totalResistance * currentSpeed / 3.6 / 1000
      );
      requestedPower = Math.min(requestedPower, this.config.motor.maxPower);
    }

    const motorState = this.motor.calculateTorque(Math.abs(requestedPower), currentSpeed);

    const powerDemand = isRegenerating
      ? requestedPower * this.config.vehicle.regenEfficiency
      : motorState.power / motorState.efficiency;

    const batteryState = this.battery.updateState(powerDemand, this.config.timeStep);

    const vehicleState = this.vehicle.updateDynamics(
      motorState.torque * (isRegenerating ? -1 : 1),
      targetSpeed,
      this.config.timeStep,
      isRegenerating
    );

    if (powerDemand > 0) {
      this.totalEnergyConsumed += (powerDemand * this.config.timeStep) / 3600;
    } else {
      this.totalEnergyRecovered += (Math.abs(powerDemand) * this.config.timeStep) / 3600;
    }

    const dataPoint: SimulationDataPoint = {
      time: this.currentTime,
      speed: vehicleState.speed,
      targetSpeed: targetSpeed,
      acceleration: vehicleState.acceleration,
      motorTorque: motorState.torque,
      motorPower: motorState.power,
      motorEfficiency: motorState.efficiency,
      batterySoC: batteryState.soc,
      batteryCurrent: batteryState.current,
      batteryPower: batteryState.power,
      energyFlow: powerDemand,
      isRegenerating: isRegenerating,
      distance: vehicleState.position / 1000,
    };

    this.dataPoints.push(dataPoint);
    this.currentTime += this.config.timeStep;

    return dataPoint;
  }

  getDataPoints(): SimulationDataPoint[] {
    return this.dataPoints;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getTotalDistance(): number {
    return this.vehicle.getState().position / 1000;
  }

  getTotalEnergyConsumed(): number {
    return this.totalEnergyConsumed;
  }

  getTotalEnergyRecovered(): number {
    return this.totalEnergyRecovered;
  }

  getResults() {
    const distance = this.getTotalDistance();
    const energyConsumed = this.getTotalEnergyConsumed();
    const energyRecovered = this.getTotalEnergyRecovered();
    const finalSoC = this.battery.getState().soc;
    const avgEfficiency = distance > 0 ? (energyConsumed / distance) * 1000 : 0;

    return {
      totalDistance: distance,
      energyConsumed,
      energyRecovered,
      finalSoC,
      avgEfficiency,
      regenerationPercentage: energyConsumed > 0 ? (energyRecovered / energyConsumed) * 100 : 0,
    };
  }

  reset(): void {
    this.battery.reset();
    this.motor.reset();
    this.vehicle.reset();
    this.dataPoints = [];
    this.currentTime = 0;
    this.totalEnergyConsumed = 0;
    this.totalEnergyRecovered = 0;
  }
}
