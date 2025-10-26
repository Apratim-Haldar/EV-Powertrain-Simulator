interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
}

export function Gauge({ value, max, label, unit, color }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-slate-200"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-300`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-slate-600">{unit}</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}
