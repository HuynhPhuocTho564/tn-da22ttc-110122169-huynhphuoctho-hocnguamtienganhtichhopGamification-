"use client";

import { Activity, BookOpen, Users, Volume2 } from "lucide-react";
import AdminPanel from "./AdminPanel";
import EmptyTableState from "./EmptyTableState";
import BarChart from "./BarChart";
import LineChart from "./LineChart";
import MetricTile from "./MetricTile";
import RateRow from "./RateRow";
import StatusPill from "./StatusPill";
import { formatDate, percent, countActive } from "./admin-utils";
import type { AdminTab } from "./types";
import type { AdminDashboardData } from "../AdminDashboardClient";

type OverviewDashboardProps = {
  data: AdminDashboardData;
  onSelectTab: (tab: AdminTab) => void;
};

/** Overview tab — 4 metric tiles + 2 charts + top-exercises panel + system-rates panel + recent users. */
export default function OverviewDashboard({ data, onSelectTab }: OverviewDashboardProps) {
  const labels = data.dailyActivity.map((item) => item.label);
  const newUsers = data.dailyActivity.map((item) => item.newUsers);
  const attempts = data.dailyActivity.map((item) => item.attempts);
  const latestActivity = data.dailyActivity[data.dailyActivity.length - 1];
  const activeContent = [
    countActive(data.exercises),
    countActive(data.maps),
    countActive(data.phonemes),
    countActive(data.wordItems),
    countActive(data.soundGroups),
    countActive(data.questionBankItems),
    countActive(data.minimalPairs),
    countActive(data.sentenceItems),
  ].reduce((total, value) => total + value, 0);
  const contentTotal =
    data.exercises.length + data.maps.length + data.phonemes.length + data.wordItems.length +
    data.soundGroups.length + data.questionBankItems.length + data.minimalPairs.length + data.sentenceItems.length;
  const activeUserRate = percent(data.stats.activeUsers, data.stats.totalUsers);
  const contentLiveRate = percent(activeContent, contentTotal);
  const averageScoreRate = Math.min(data.stats.averageScore, 100);
  const recentUsers = data.users.slice(0, 5);

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile icon={Users} label="Tổng người dùng" value={data.stats.totalUsers} hint={`${data.stats.activeUsers} tài khoản active`} tone="blue" />
        <MetricTile icon={BookOpen} label="Bài tập" value={data.stats.totalExercises} hint={`${data.stats.completedAttempts} lượt hoàn thành`} tone="emerald" />
        <MetricTile icon={Volume2} label="File audio" value={data.stats.totalAudioFiles} hint="Dữ liệu từ bảng AudioFile" tone="amber" />
        <MetricTile icon={Activity} label="Điểm TB 7 ngày" value={`${data.stats.averageScore}%`} hint={`${data.stats.completedAttemptsLast7Days} lượt luyện tập`} tone="purple" />
      </dl>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminPanel
          title="Người dùng mới"
          subtitle="7 ngày gần đây"
          action={
            <button type="button" onClick={() => onSelectTab("users")}
              className="rounded-md px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Xem tài khoản
            </button>
          }
        >
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <div className="text-2xl font-bold text-slate-950">{data.stats.newUsersLast7Days}</div>
              <p className="text-sm text-slate-600">Tài khoản mới</p>
            </div>
            <div className="text-right text-sm">
              <div className="font-bold text-emerald-700">+{latestActivity?.newUsers ?? 0}</div>
              <p className="text-slate-500">Hôm nay</p>
            </div>
          </div>
          <LineChart labels={labels} values={newUsers} />
        </AdminPanel>

        <AdminPanel
          title="Lượt luyện tập"
          subtitle="Bài hoàn thành theo ngày"
          action={
            <button type="button" onClick={() => onSelectTab("reports")}
              className="rounded-md px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Xem báo cáo
            </button>
          }
        >
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <div className="text-2xl font-bold text-slate-950">{data.stats.completedAttemptsLast7Days}</div>
              <p className="text-sm text-slate-600">Lượt hoàn thành</p>
            </div>
            <div className="text-right text-sm">
              <div className="font-bold text-emerald-700">{latestActivity?.attempts ?? 0}</div>
              <p className="text-slate-500">Hôm nay</p>
            </div>
          </div>
          <BarChart labels={labels} values={attempts} />
        </AdminPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminPanel
          title="Bài tập nổi bật"
          subtitle="Sắp xếp theo số lượt hoàn thành trong 7 ngày"
          action={
            <button type="button" onClick={() => onSelectTab("exercises")}
              className="rounded-md px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Quản lý bài tập
            </button>
          }
        >
          {data.reports.topExercises.length === 0 ? (
            <EmptyTableState>Chưa có lượt làm bài trong 7 ngày gần đây.</EmptyTableState>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-bold">Bài tập</th>
                    <th className="px-2 py-2 font-bold">Lượt làm</th>
                    <th className="px-2 py-2 font-bold">Điểm TB</th>
                    <th className="px-2 py-2 font-bold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.reports.topExercises.map((exercise) => (
                    <tr key={exercise.id} className="hover:bg-slate-50">
                      <td className="px-2 py-3 font-semibold text-slate-900">{exercise.name}</td>
                      <td className="px-2 py-3 text-slate-700">{exercise.completions}</td>
                      <td className="px-2 py-3 text-slate-700">{exercise.avgScore}%</td>
                      <td className="px-2 py-3">
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Có dữ liệu
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="Tổng quan hệ thống" subtitle="Tỷ lệ vận hành từ dữ liệu thật">
          <div className="space-y-5">
            <RateRow label="Tài khoản active" value={activeUserRate} tone="emerald" />
            <RateRow label="Nội dung ACTIVE" value={contentLiveRate} tone="blue" />
            <RateRow label="Điểm trung bình" value={averageScoreRate} tone="purple" />
            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-sm">
              <button type="button" onClick={() => onSelectTab("questions")}
                className="rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500">
                {data.questionBankItems.length}
                <span className="mt-1 block text-xs font-normal text-slate-500">Câu hỏi</span>
              </button>
              <button type="button" onClick={() => onSelectTab("badges")}
                className="rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500">
                {data.badges.length}
                <span className="mt-1 block text-xs font-normal text-slate-500">Huy hiệu</span>
              </button>
            </div>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Tài khoản mới" subtitle="5 người dùng được tạo gần nhất">
        {recentUsers.length === 0 ? (
          <EmptyTableState>Chưa có tài khoản người dùng.</EmptyTableState>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-bold">Người dùng</th>
                  <th className="px-2 py-2 font-bold">Email</th>
                  <th className="px-2 py-2 font-bold">Role</th>
                  <th className="px-2 py-2 font-bold">Trạng thái</th>
                  <th className="px-2 py-2 font-bold">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-2 py-3 font-semibold text-slate-900">{user.username}</td>
                    <td className="px-2 py-3 text-slate-700">{user.email}</td>
                    <td className="px-2 py-3 text-slate-700">{user.role}</td>
                    <td className="px-2 py-3"><StatusPill status={user.status} /></td>
                    <td className="px-2 py-3 text-slate-700">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
