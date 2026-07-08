"use client";

type LineChartProps = {
  labels: string[];
  series: Array<{
    label: string;
    values: number[];
    color: string;
    fillColor: string;
  }>;
};

/**
 * Multi-series SVG line + area chart.
 * Shows Y-axis labels, grid lines, and a legend.
 */
export default function LineChart({ labels, series }: LineChartProps) {
  const width = 560;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Find global max across all series
  const allValues = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allValues, 1);
  // Round up to a nice number for Y-axis
  const yMax = Math.ceil(rawMax / 5) * 5 || 5;
  const ySteps = 5;
  const yStepValue = yMax / ySteps;

  function getY(value: number): number {
    return paddingTop + plotHeight - (value / yMax) * plotHeight;
  }

  function getX(index: number): number {
    return paddingLeft + (plotWidth / Math.max(labels.length - 1, 1)) * index;
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Biểu đồ hoạt động">
        {/* Y-axis grid lines + labels */}
        {Array.from({ length: ySteps + 1 }, (_, i) => {
          const value = Math.round(yStepValue * i);
          const y = getY(value);
          return (
            <g key={`y-${i}`}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? "0" : "4,4"}
              />
              <text
                x={paddingLeft - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, index) => (
          <text
            key={`label-${index}`}
            x={getX(index)}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-500 text-[10px]"
          >
            {label}
          </text>
        ))}

        {/* Series: area + line + dots */}
        {series.map((s, si) => {
          const points = s.values.map((v, i) => ({ x: getX(i), y: getY(v) }));
          const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
          const areaPoints = `${getX(0)},${getY(0)} ${linePoints} ${getX(labels.length - 1)},${getY(0)}`;

          return (
            <g key={si}>
              <polygon points={areaPoints} fill={s.fillColor} />
              <polyline
                points={linePoints}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((point, i) => (
                <circle
                  key={`dot-${si}-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  fill="white"
                  stroke={s.color}
                  strokeWidth="2.5"
                >
                  <title>{`${labels[i]}: ${s.values[i]} ${s.label}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-5">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
