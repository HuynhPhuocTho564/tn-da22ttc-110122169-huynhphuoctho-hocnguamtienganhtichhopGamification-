"use client";

import { CheckCircle2, CloudFog } from "lucide-react";
import { AdminPanel } from "../ui";
import { classNames, percent } from "./admin-utils";
import type { AdminDashboardData } from "../AdminDashboardClient";

type MapsProgressListProps = {
  mapsProgress: AdminDashboardData["mapsProgress"];
  totalActiveUsers: number;
};

const PROGRESS_BAR_FILLED_THRESHOLD = 50;
const TONE_CLASSES = {
  low: "bg-slate-500",
  mid: "bg-blue-500",
  high: "bg-emerald-500",
} as const;

function toneForRate(rate: number): keyof typeof TONE_CLASSES {
  if (rate >= PROGRESS_BAR_FILLED_THRESHOLD) return "high";
  if (rate >= 20) return "mid";
  return "low";
}

/**
 * "Learning Maps Progress" panel on the Overview dashboard.
 * Renders one progress bar per Learning Map showing how many active
 * users have started the map. Maps locked behind another map's
 * completion show a "Sương mù đang che phủ" fog indicator.
 * Sorted by completion rate (descending).
 */
export default function MapsProgressList({ mapsProgress, totalActiveUsers }: MapsProgressListProps) {
  const lockedCount = mapsProgress.filter((m) => m.requiredMapId !== null).length;
  const subtitle = lockedCount > 0
    ? `Tỷ lệ người học active đã bắt đầu mỗi map (tổng: ${totalActiveUsers}) • ${lockedCount} map đang bị sương mù che phủ`
    : `Tỷ lệ người học active đã bắt đầu mỗi map (tổng: ${totalActiveUsers})`;

  return (
    <AdminPanel
      title="Tiến độ các bản đồ học tập"
      subtitle={subtitle}
    >
      {mapsProgress.length === 0 ? (
        <p className="text-sm text-slate-600">Chưa có bản đồ học tập nào trong hệ thống.</p>
      ) : (
        <ul className="space-y-4">
          {mapsProgress.map((map) => (
            <MapProgressRow key={map.id} map={map} totalActiveUsers={totalActiveUsers} />
          ))}
        </ul>
      )}
    </AdminPanel>
  );
}

function MapProgressRow({
  map,
  totalActiveUsers,
}: {
  map: AdminDashboardData["mapsProgress"][number];
  totalActiveUsers: number;
}) {
  const tone = toneForRate(map.completionRate);
  const coverageRate = percent(map.startedUsers, Math.max(totalActiveUsers, 1));
  const isLocked = map.requiredMapId !== null;

  return (
    <li className={classNames(isLocked && "rounded-md border border-slate-200 bg-slate-50 p-3")}>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <span>{map.name}</span>
          {!isLocked && map.completionRate >= PROGRESS_BAR_FILLED_THRESHOLD && (
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
          )}
          {isLocked && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700"
              title="Map bị khóa bởi sương mù"
            >
              <CloudFog aria-hidden="true" className="h-3 w-3" />
              Sương mù
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>{map.startedUsers} / {totalActiveUsers || 0} người học</span>
          <span className="font-bold text-slate-900">{map.completionRate}%</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div
          className={classNames("h-full rounded-full transition-all", isLocked ? "bg-slate-300" : TONE_CLASSES[tone])}
          style={{ width: `${coverageRate}%` }}
        />
      </div>
      {isLocked ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
          <CloudFog aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span>
            <strong className="font-semibold text-slate-700">Sương mù đang che phủ.</strong>{" "}
            Hoàn thành <strong>{map.requiredMapName ?? "(map cha)"}</strong> ≥ {map.unlockThresholdPercent}% để mở khóa đảo này.
          </span>
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-500">{map.exerciseCount} bài tập • trạng thái: {map.status}</p>
      )}
    </li>
  );
}
