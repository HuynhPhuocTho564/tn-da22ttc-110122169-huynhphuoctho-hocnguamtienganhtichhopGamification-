"use client";

import { BookOpen, Headphones, Users } from "lucide-react";
import { AdminPanel, EmptyTableState, MetricTile, StatusPill } from "../ui";
import BarChart from "./BarChart";

import LineChart from "./LineChart";
import { formatDate } from "./admin-utils";
import type { AdminTab } from "./types";
import type { AdminDashboardData } from "../AdminDashboardClient";

type OverviewDashboardProps = {
  data: AdminDashboardData;
  onSelectTab: (tab: AdminTab) => void;
};

const TOP_EXERCISES_LIMIT = 10;

/**
 * Overview tab — implements DECU/ADMIN_DASHBOARD_SPECIFICATION.md §8.2.
 * Layout: 4 metric tiles → Daily Activity + Top Exercises → Maps Progress → Alerts → Recent users.
 */
export default function OverviewDashboard({ data, onSelectTab }: OverviewDashboardProps) {
  const labels = data.dailyActivity.map((item) => item.label);
  const newUsers = data.dailyActivity.map((item) => item.newUsers);
  const attempts = data.dailyActivity.map((item) => item.attempts);
  const latestActivity = data.dailyActivity[data.dailyActivity.length - 1];
  const topExercises = data.reports.topExercises.slice(0, TOP_EXERCISES_LIMIT);
  const recentUsers = data.users.slice(0, 5);

  return (
    <div className="space-y-5">
      <MetricTiles
        stats={data.stats}
        activeUsers={data.stats.activeUsers}
        newUsersLast7Days={data.stats.newUsersLast7Days}
        completedAttempts={data.stats.completedAttempts}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminPanel
          title="Hoạt động theo ngày"
          subtitle={`Người dùng mới & lượt luyện tập — ${data.rangeDays} ngày gần đây`}
        >
          <div className="mb-2 grid grid-cols-2 gap-4 text-sm">
            <ActivitySummary
              label="Người dùng mới"
              total={data.stats.newUsersLast7Days}
              today={latestActivity?.newUsers ?? 0}
            />
            <ActivitySummary
              label="Lượt hoàn thành"
              total={data.stats.completedAttemptsLast7Days}
              today={latestActivity?.attempts ?? 0}
            />
          </div>
          <LineChart
            labels={labels}
            series={[
              { label: "Người dùng mới", values: newUsers, color: "#2563eb", fillColor: "rgba(37,99,235,0.1)" },
              { label: "Lượt hoàn thành", values: attempts, color: "#16a34a", fillColor: "rgba(22,163,74,0.1)" },
            ]}
          />
        </AdminPanel>

        <AdminPanel
          title="Top bài tập"
          subtitle={`${TOP_EXERCISES_LIMIT} bài có nhiều lượt hoàn thành nhất trong ${data.rangeDays} ngày`}
        >
          {topExercises.length === 0 ? (
            <EmptyTableState>Chưa có lượt làm bài trong 7 ngày gần đây.</EmptyTableState>
          ) : (
            <BarChart
              labels={topExercises.map((exercise) => exercise.name)}
              values={topExercises.map((exercise) => exercise.completions)}
              horizontal
            />
          )}
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

function MetricTiles({
  stats,
  activeUsers,
  newUsersLast7Days,
  completedAttempts,
}: {
  stats: AdminDashboardData["stats"];
  activeUsers: number;
  newUsersLast7Days: number;
  completedAttempts: number;
}) {
  return (
    <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MetricTile icon={Users} label="Tổng người dùng" value={stats.totalUsers} hint={`${activeUsers} active • +${newUsersLast7Days} trong 7 ngày`} tone="blue" />
      <MetricTile icon={BookOpen} label="Bài tập" value={stats.totalExercises} hint={`${completedAttempts} lượt hoàn thành`} tone="emerald" />
      <MetricTile icon={Headphones} label="Câu hỏi" value={stats.totalQuestions} hint="Đã gắn vào bài tập" tone="purple" />
    </dl>
  );
}

function ActivitySummary({ label, total, today }: { label: string; total: number; today: number }) {
  return (
    <div>
      <div className="text-2xl font-bold text-slate-950">{total}</div>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-xs text-emerald-700">+{today} hôm nay</p>
    </div>
  );
}
