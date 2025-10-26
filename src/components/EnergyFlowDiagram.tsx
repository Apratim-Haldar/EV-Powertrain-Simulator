import { Battery, Zap, Car, ArrowRight, ArrowLeft } from 'lucide-react';

interface EnergyFlowProps {
  batterySoC: number;
  batteryPower: number;
  motorPower: number;
  isRegenerating: boolean;
  speed: number;
}

export function EnergyFlowDiagram({
  batterySoC,
  batteryPower,
  motorPower,
  isRegenerating,
  speed,
}: EnergyFlowProps) {
  const flowIntensity = Math.min(Math.abs(batteryPower) / 50, 1);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-xl border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Energy Flow</h3>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center space-y-2">
          <div
            className={`p-6 rounded-xl transition-all ${
              batterySoC > 50
                ? 'bg-green-500'
                : batterySoC > 20
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          >
            <Battery className="h-12 w-12 text-white" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{batterySoC.toFixed(1)}%</p>
            <p className="text-sm text-slate-600">Battery SoC</p>
            <p className="text-xs text-slate-500 mt-1">
              {batteryPower.toFixed(1)} kW
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          {isRegenerating ? (
            <div className="flex items-center space-x-2">
              <div
                className="h-1 bg-gradient-to-l from-blue-500 to-transparent transition-all"
                style={{
                  width: `${100 * flowIntensity}px`,
                  opacity: 0.3 + 0.7 * flowIntensity,
                }}
              />
              <ArrowLeft
                className="h-8 w-8 text-blue-500 animate-pulse"
                style={{ animationDuration: `${1 / (flowIntensity + 0.1)}s` }}
              />
              <div
                className="h-1 bg-gradient-to-l from-blue-500 to-transparent transition-all"
                style={{
                  width: `${100 * flowIntensity}px`,
                  opacity: 0.3 + 0.7 * flowIntensity,
                }}
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div
                className="h-1 bg-gradient-to-r from-green-500 to-transparent transition-all"
                style={{
                  width: `${100 * flowIntensity}px`,
                  opacity: 0.3 + 0.7 * flowIntensity,
                }}
              />
              <ArrowRight
                className="h-8 w-8 text-green-500 animate-pulse"
                style={{ animationDuration: `${1 / (flowIntensity + 0.1)}s` }}
              />
              <div
                className="h-1 bg-gradient-to-r from-green-500 to-transparent transition-all"
                style={{
                  width: `${100 * flowIntensity}px`,
                  opacity: 0.3 + 0.7 * flowIntensity,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div
            className={`p-6 rounded-xl transition-all ${
              isRegenerating ? 'bg-blue-500' : 'bg-green-500'
            }`}
          >
            <Zap className="h-12 w-12 text-white" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{motorPower.toFixed(1)}</p>
            <p className="text-sm text-slate-600">Motor kW</p>
            <p className="text-xs text-slate-500 mt-1">
              {isRegenerating ? 'Regenerating' : 'Driving'}
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <ArrowRight className="h-8 w-8 text-slate-400" />
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="p-6 bg-slate-700 rounded-xl">
            <Car className="h-12 w-12 text-white" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{speed.toFixed(0)}</p>
            <p className="text-sm text-slate-600">Speed km/h</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-slate-600">Power Flow</p>
          <p className="text-sm font-semibold text-slate-900">
            {isRegenerating ? 'Recovery Mode' : 'Discharge Mode'}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-slate-600">Efficiency</p>
          <p className="text-sm font-semibold text-slate-900">
            {motorPower > 0 ? ((motorPower / Math.abs(batteryPower)) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
