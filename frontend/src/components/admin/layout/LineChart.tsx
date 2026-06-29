"use client";

type LineChartProps = {
  labels: string[];
  values: number[];
};

/**
 * Inline SVG line + area chart used on the Overview dashboard.
 * Self-contained: no external deps beyond React.
 */
export default function LineChart({ labels, values }: LineChartProps) {
  const width = 520;
  const height = 180;
  const padding = 28;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = padding + (plotWidth / Math.max(values.length - 1, 1)) * index;
    const y = padding + plotHeight - (value / maxValue) * plotHeight;
    return { x, y };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full text-blue-500" role="img" aria-label="Biểu đồ người dùng mới 7 ngày">
      {[0, 1, 2, 3].map((item) => {
        const y = padding + (plotHeight / 3) * item;
        return <line key={item} x1={padding} x2={width - padding} y1={y} y2={y} stroke="currentColor" className="text-slate-200" />;
      })}
      <polygon points={areaPoints} fill="currentColor" className="text-blue-100" />
      <polyline points={linePoints} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => (
        <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="4" fill="white" stroke="currentColor" strokeWidth="3">
          <title>{`${labels[index]}: ${values[index]}`}</title>
        </circle>
      ))}
      {labels.map((label, index) => {
        const x = padding + (plotWidth / Math.max(labels.length - 1, 1)) * index;
        return (
          <text key={label} x={x} y={height - 5} textAnchor="middle" className="fill-slate-500 text-[11px]">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
