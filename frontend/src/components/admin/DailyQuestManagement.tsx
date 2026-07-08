"use client";

import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { AdminPanel, EmptyTableState, StatusPill } from "@/components/admin/ui";
import { formatDate, percent } from "./layout/admin-utils";

/**
 * Daily Quest management UI.
 *
 * PLAN/ADMIN_DASHBOARD_new.md §4 — Quản lý template nhiệm vụ hằng ngày
 * và theo dõi tiến độ user.
 *
 * - Templates: constants (no DB schema yet). 5 quest types per spec §3.7.
 * - User progress: read-only from `DailyQuest` table (prisma.dailyQuest).
 * - Reward: +50 XP + 10 Gems/quest (constants).
 */

export type DailyQuestTemplate = {
  questType: string;
  label: string;
  description: string;
  target: number;
  rewardXp: number;
  rewardGems: number;
};

const QUEST_TEMPLATES: DailyQuestTemplate[] = [
  { questType: "PRACTICE_3", label: "Luyện tập 3 bài", description: "Hoàn thành 3 bài bất kỳ", target: 3, rewardXp: 50, rewardGems: 10 },
  { questType: "CD1_3", label: "Nguyên âm ×3", description: "Hoàn thành 3 bài Chủ đề 1 (Nguyên âm)", target: 3, rewardXp: 50, rewardGems: 10 },
  { questType: "CD2_3", label: "Phụ âm ×3", description: "Hoàn thành 3 bài Chủ đề 2 (Phụ âm)", target: 3, rewardXp: 50, rewardGems: 10 },
  { questType: "CD3_3", label: "Minimal Pairs ×3", description: "Hoàn thành 3 bài Chủ đề 3 (Minimal Pairs)", target: 3, rewardXp: 50, rewardGems: 10 },
  { questType: "CD4_LINKING_3", label: "Trọng âm & Nối âm ×3", description: "Hoàn thành 3 bài Chủ đề 4 (Stress & Linking)", target: 3, rewardXp: 50, rewardGems: 10 },
];

export type DailyQuestLog = {
  id: string;
  userId: string;
  username: string;
  date: string;
  questType: string;
  progress: number;
  target: number;
  completed: boolean;
  claimedAt: string | null;
};

type DailyQuestManagementProps = {
  logs: DailyQuestLog[];
};

const COMPLETED_ICON = CheckCircle2;
const PENDING_ICON = Circle;

export default function DailyQuestManagement({ logs }: DailyQuestManagementProps) {
  const todayKey = logs[0]?.date ?? "";
  const todaysQuests = logs.filter((log) => log.date === todayKey);
  const completedToday = todaysQuests.filter((log) => log.completed).length;
  const totalToday = todaysQuests.length;
  const completionRate = percent(completedToday, totalToday);
  const totalClaimed = logs.filter((log) => log.claimedAt !== null).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Quest templates" value={QUEST_TEMPLATES.length} tone="blue" />
        <StatTile label="Quests hôm nay" value={totalToday} tone="emerald" />
        <StatTile label="Hoàn thành hôm nay" value={`${completedToday} / ${totalToday}`} hint={`${completionRate}%`} tone="purple" />
        <StatTile label="Tổng đã claim" value={totalClaimed} tone="amber" />
      </div>

      <AdminPanel
        title="5 Quest Templates"
        subtitle="Random 3 quest/ngày cho mỗi user. Reset 00:00 hằng ngày."
      >
        <ul className="space-y-3">
          {QUEST_TEMPLATES.map((template) => (
            <li
              key={template.questType}
              className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <ListChecks aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-900">{template.label}</div>
                <div className="text-xs text-slate-600">{template.description}</div>
                <code className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{template.questType}</code>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-slate-900">+{template.rewardXp} XP</div>
                <div className="text-amber-700">+{template.rewardGems} Gems</div>
              </div>
            </li>
          ))}
        </ul>
      </AdminPanel>

      <AdminPanel
        title="Tiến độ quest hôm nay"
        subtitle="Snapshot DailyQuest của user cho ngày hiện tại"
      >
        {todaysQuests.length === 0 ? (
          <EmptyTableState>Chưa có quest nào được tạo cho hôm nay.</EmptyTableState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-bold">User</th>
                  <th className="px-2 py-2 font-bold">Quest</th>
                  <th className="px-2 py-2 font-bold">Tiến độ</th>
                  <th className="px-2 py-2 font-bold">Trạng thái</th>
                  <th className="px-2 py-2 font-bold">Claim lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todaysQuests.map((log) => {
                  const Icon = log.completed ? COMPLETED_ICON : PENDING_ICON;
                  const template = QUEST_TEMPLATES.find((t) => t.questType === log.questType);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-2 py-3 font-semibold text-slate-900">{log.username}</td>
                      <td className="px-2 py-3 text-slate-700">{template?.label ?? log.questType}</td>
                      <td className="px-2 py-3 text-slate-700">
                        {log.progress} / {log.target}
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold">
                          <Icon aria-hidden="true" className={`h-4 w-4 ${log.completed ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className={log.completed ? "text-emerald-700" : "text-slate-600"}>
                            {log.completed ? "Hoàn thành" : "Đang làm"}
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-3 text-slate-500">
                        {log.claimedAt ? formatDate(log.claimedAt) : <StatusPill status="PENDING" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function StatTile({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone: "blue" | "emerald" | "amber" | "purple" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  } as const;
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-xs font-bold uppercase opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-80">{hint}</div>}
    </div>
  );
}
