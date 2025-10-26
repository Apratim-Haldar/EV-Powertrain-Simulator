import { useMemo } from 'react';

interface DataPoint {
  x: number;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  xLabel?: string;
  yLabel?: string;
}

export function LineChart({
  data,
  width = 600,
  height = 300,
  color = '#10b981',
  label = '',
  xLabel = 'Time (s)',
  yLabel = 'Value',
}: LineChartProps) {
  const { path, minY, maxY, minX, maxX } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', minY: 0, maxY: 100, minX: 0, maxX: 100 };
    }

    const minY = Math.min(...data.map((d) => d.y));
    const maxY = Math.max(...data.map((d) => d.y));
    const minX = Math.min(...data.map((d) => d.x));
    const maxX = Math.max(...data.map((d) => d.x));

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const scaleX = (x: number) =>
      padding + ((x - minX) / (maxX - minX)) * chartWidth;
    const scaleY = (y: number) =>
      height - padding - ((y - minY) / (maxY - minY)) * chartHeight;

    const pathData = data
      .map((point, i) => {
        const x = scaleX(point.x);
        const y = scaleY(point.y);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');

    return { path: pathData, minY, maxY, minX, maxX };
  }, [data, width, height]);

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      {label && (
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{label}</h3>
      )}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1="40"
          y1={height - 40}
          x2={width - 40}
          y2={height - 40}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <line
          x1="40"
          y1="40"
          x2="40"
          y2={height - 40}
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {path && (
          <>
            <path
              d={`${path} L ${width - 40} ${height - 40} L 40 ${height - 40} Z`}
              fill={`url(#gradient-${label})`}
            />
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}

        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-xs fill-slate-600"
        >
          {xLabel}
        </text>
        <text
          x="10"
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 10, ${height / 2})`}
          className="text-xs fill-slate-600"
        >
          {yLabel}
        </text>

        <text x="40" y="35" className="text-xs fill-slate-600">
          {maxY.toFixed(1)}
        </text>
        <text x="40" y={height - 25} className="text-xs fill-slate-600">
          {minY.toFixed(1)}
        </text>
      </svg>
    </div>
  );
}
