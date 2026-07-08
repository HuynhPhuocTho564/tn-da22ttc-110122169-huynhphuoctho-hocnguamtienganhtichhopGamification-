"use client";

import { AdminPanel, EmptyTableState } from "@/components/admin/ui";
import { formatDate } from "./layout/admin-utils";

/**
 * Spin Wheel log viewer.
 *
 * Pure presentational component — no state, no API calls. Receives the
 * pre-fetched log array from the server component (page.tsx) and renders
 * the most recent entries.
 *
 * Kept separate from SpinWheelPrizeConfig (which owns the prize CRUD state)
 * so each component can be tested and reasoned about independently.
 */

export type SpinWheelLog = {
  id: string;
  userId: string;
  username: string;
  prize: string;
  prizeValue: number;
  spunAt: string;
};

const RECENT_LOG_LIMIT = 20;

type SpinWheelLogViewerProps = {
  logs: SpinWheelLog[];
};

export default function SpinWheelLogViewer({ logs }: SpinWheelLogViewerProps) {
  const recentLogs = logs.slice(0, RECENT_LOG_LIMIT);

  return (
    <AdminPanel
      title="Lịch sử quay gần nhất"
      subtitle={`${RECENT_LOG_LIMIT} lượt quay mới nhất từ bảng SpinWheelLog`}
    >
      {recentLogs.length === 0 ? (
        <EmptyTableState>Chưa có lượt quay nào.</EmptyTableState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2 font-bold">Người chơi</th>
                <th className="px-2 py-2 font-bold">Phần thưởng</th>
                <th className="px-2 py-2 font-bold">Giá trị</th>
                <th className="px-2 py-2 font-bold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-2 py-3 font-semibold text-slate-900">{log.username}</td>
                  <td className="px-2 py-3 text-slate-700">{log.prize}</td>
                  <td className="px-2 py-3 text-slate-700">{log.prizeValue}</td>
                  <td className="px-2 py-3 text-slate-500">{formatDate(log.spunAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  );
}
