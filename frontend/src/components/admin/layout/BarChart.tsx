"use client";

type BarChartProps = {
  labels: string[];
  values: number[];
  horizontal?: boolean;
};

/**
 * Inline SVG bar chart used on the Overview dashboard.
 * Self-contained: no external deps beyond React.
 * Supports both vertical (default) and horizontal orientation.
 */
export default function BarChart({ labels, values, horizontal }: BarChartProps) {
  if (horizontal) {
    const rowHeight = 32;
    const labelWidth = 200;
    const barAreaWidth = 260;
    const totalWidth = labelWidth + barAreaWidth + 40;
    const totalHeight = labels.length * rowHeight + 8;
    const maxValue = Math.max(...values, 1);

    return (
      <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="w-full" role="img" aria-label="Biểu đồ lượt luyện tập 7 ngày">
        {values.map((value, index) => {
          const y = index * rowHeight + 4;
          const barW = value > 0 ? Math.max((value / maxValue) * barAreaWidth, 3) : 0;
          return (
            <g key={index}>
              <text x={labelWidth - 8} y={y + rowHeight / 2 + 4} textAnchor="end" className="fill-slate-600 text-[11px]">
                {labels[index]}
              </text>
              <rect x={labelWidth} y={y + 6} width={barW} height={rowHeight - 12} rx="3" className="fill-emerald-500">
                <title>{`${labels[index]}: ${value}`}</title>
              </rect>
              <text x={labelWidth + barW + 6} y={y + rowHeight / 2 + 4} className="fill-slate-500 text-[11px]">
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const width = 520;
  const height = 180;
  const padding = 28;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const maxValue = Math.max(...values, 1);
  const step = plotWidth / Math.max(values.length, 1);
  const barWidth = step * 0.48;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full text-emerald-500" role="img" aria-label="Biểu đồ lượt luyện tập 7 ngày">
      {[0, 1, 2, 3].map((item) => {
        const y = padding + (plotHeight / 3) * item;
        return <line key={item} x1={padding} x2={width - padding} y1={y} y2={y} stroke="currentColor" className="text-slate-200" />;
      })}
      {values.map((value, index) => {
        const barHeight = value > 0 ? Math.max((value / maxValue) * plotHeight, 3) : 0;
        const x = padding + step * index + (step - barWidth) / 2;
        const y = padding + plotHeight - barHeight;

        return (
          <rect key={`bar-${index}`} x={x} y={y} width={barWidth} height={barHeight} rx="3" fill="currentColor">
            <title>{`${labels[index]}: ${value}`}</title>
          </rect>
        );
      })}
      {labels.map((label, index) => {
        const x = padding + step * index + step / 2;
        return (
          <text key={`label-${index}`} x={x} y={height - 5} textAnchor="middle" className="fill-slate-500 text-[11px]">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
