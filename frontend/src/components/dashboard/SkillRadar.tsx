import React from "react";
import Card from "@/components/ui/Card";

/**
 * SkillRadar — radar chart SVG 4 axes: Nguyên âm / Phụ âm / Âm khó / Nối âm.
 *
 * Hiển thị điểm trung bình (0-100) của user ở mỗi chủ đề IPA (Task 6.4).
 * Thuần SVG — không cần chart library (YAGNI, performance tốt).
 *
 * @module dashboard/SkillRadar
 */

export type SkillScores = {
  vowels: number;
  consonants: number;
  difficult: number;
  linking: number;
};

type SkillRadarProps = {
  scores: SkillScores;
};

// 4 axes, mỗi axis 90° (top, right, bottom, left)
const AXES: Array<{ key: keyof SkillScores; label: string; angle: number }> = [
  { key: "vowels", label: "Nguyên âm", angle: -90 }, // top
  { key: "consonants", label: "Phụ âm", angle: 0 }, // right
  { key: "difficult", label: "Âm khó", angle: 90 }, // bottom
  { key: "linking", label: "Nối âm", angle: 180 }, // left
];

const CENTER = 120;
const MAX_RADIUS = 90;
const GRID_LEVELS = [25, 50, 75, 100];

function axisPoint(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export default function SkillRadar({ scores }: SkillRadarProps) {
  // Chỉ hiện axes cho chủ đề user đã luyện (score > 0)
  // Tạo cảm giác "mở khóa" dần — mới đầu chỉ thấy Nguyên âm
  const activeAxes = AXES.filter((axis) => scores[axis.key] > 0);
  const hasData = activeAxes.length > 0;

  // Nếu chỉ có 1 chủ đề → hiện progress bar thay vì radar (radar cần ≥2 axes)
  const showRadar = activeAxes.length >= 2;

  return (
    <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-900">🎯 Kỹ năng của bạn</h3>
        <span className="text-xs font-semibold text-neutral-500">
          {activeAxes.length}/{AXES.length} chủ đề
        </span>
      </div>

      {!hasData ? (
        <p className="mt-3 text-xs text-neutral-600">
          Làm bài tập để thấy điểm mạnh/yếu của bạn ở mỗi chủ đề phát âm.
        </p>
      ) : !showRadar ? (
        /* Single topic — progress bar view */
        <div className="mt-3 space-y-2">
          {activeAxes.map((axis) => (
            <div key={axis.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-700">{axis.label}</span>
                <span className="font-bold text-primary-600">{scores[axis.key]}</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-700"
                  style={{ width: `${scores[axis.key]}%` }}
                />
              </div>
            </div>
          ))}
          {activeAxes.length < AXES.length && (
            <p className="text-xs text-neutral-500">
              🔒 Luyện thêm để mở khóa các chủ đề khác
            </p>
          )}
        </div>
      ) : (
        /* Radar chart — ≥2 active topics */
        <div className="mt-3 flex items-center justify-center">
          <svg
            viewBox="0 0 240 240"
            className="h-56 w-56"
            role="img"
            aria-label={`Radar kỹ năng: ${activeAxes.map((a) => `${a.label} ${scores[a.key]}`).join(", ")}`}
          >
            {/* Grid lines */}
            {GRID_LEVELS.map((level) => (
              <polygon
                key={level}
                points={polygonPoints((level / 100) * MAX_RADIUS, activeAxes)}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* Axis lines */}
            {activeAxes.map((axis, i) => {
              const angle = -90 + (360 / activeAxes.length) * i;
              const end = axisPoint(angle, MAX_RADIUS);
              return (
                <line key={axis.key} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth="1" />
              );
            })}

            {/* Data polygon */}
            <polygon
              points={dataPolygonPoints(scores, activeAxes)}
              fill="rgba(37, 99, 235, 0.25)"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {activeAxes.map((axis, i) => {
              const value = Math.max(0, Math.min(100, scores[axis.key]));
              const angle = -90 + (360 / activeAxes.length) * i;
              const radius = (value / 100) * MAX_RADIUS;
              const p = axisPoint(angle, radius);
              return <circle key={`pt-${axis.key}`} cx={p.x} cy={p.y} r="4" fill="#2563eb" />;
            })}

            {/* Axis labels */}
            {activeAxes.map((axis, i) => {
              const angle = -90 + (360 / activeAxes.length) * i;
              const labelPoint = axisPoint(angle, MAX_RADIUS + 18);
              const value = scores[axis.key];
              return (
                <g key={`label-${axis.key}`}>
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-neutral-700 text-[10px] font-bold"
                  >
                    {axis.label}
                  </text>
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y + 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-primary-600 text-[10px] font-bold"
                  >
                    {value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Locked topics hint */}
      {hasData && activeAxes.length < AXES.length && showRadar && (
        <p className="mt-1 text-center text-[10px] text-neutral-500">
          🔒 {AXES.length - activeAxes.length} chủ đề chưa mở — luyện bài để mở khóa
        </p>
      )}

      {/* Weakest skill hint — chỉ gợi ý chủ đề đã mở */}
      {hasData && (() => {
        const sorted = activeAxes.sort((a, b) => scores[a.key] - scores[b.key]);
        const weakest = sorted[0];
        if (!weakest || scores[weakest.key] >= 60) return null;
        return (
          <p className="mt-2 text-center text-xs font-semibold text-warning-700">
            💪 &quot;{weakest.label}&quot; cần luyện thêm — chọn bài chủ đề này để cải thiện!
          </p>
        );
      })()}
    </Card>
  );
}

// Helper overloads for dynamic axes
function polygonPoints(radius: number, axes: typeof AXES): string {
  return axes.map((_, i) => {
    const angle = -90 + (360 / axes.length) * i;
    const p = axisPoint(angle, radius);
    return `${p.x},${p.y}`;
  }).join(" ");
}

function dataPolygonPoints(scores: SkillScores, axes: typeof AXES): string {
  return axes.map((axis, i) => {
    const value = Math.max(0, Math.min(100, scores[axis.key]));
    const angle = -90 + (360 / axes.length) * i;
    const radius = (value / 100) * MAX_RADIUS;
    const p = axisPoint(angle, radius);
    return `${p.x},${p.y}`;
  }).join(" ");
}
