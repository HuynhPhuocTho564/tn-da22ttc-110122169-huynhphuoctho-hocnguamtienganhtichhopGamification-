"use client";

import Link from "next/link";
import { useState } from "react";
import DailyCheckIn from "@/components/gamification/DailyCheckIn";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type CheckInStatus = {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string | null;
  canCheckIn: boolean;
  todayReward: {
    xp: number;
    rankingScore: number;
  };
};

const STREAK_MILESTONES = [
  { days: 3, title: "Khởi động thói quen", reward: "Huy hiệu Thường", icon: "🔥", tierClass: "tier-bronze" },
  { days: 7, title: "Một tuần bền bỉ", reward: "Huy hiệu Hiếm", icon: "⚡", tierClass: "tier-silver" },
  { days: 14, title: "Nhịp học ổn định", reward: "Huy hiệu Huyền thoại", icon: "🏆", tierClass: "tier-gold" },
] as const;

function StreakMilestoneCard({
  milestone,
  currentStreak,
}: {
  milestone: (typeof STREAK_MILESTONES)[number];
  currentStreak: number;
}) {
  const achieved = currentStreak >= milestone.days;
  const progressPercent = Math.min(100, Math.round((currentStreak / milestone.days) * 100));

  return (
    <div
      className={`relative rounded-2xl p-5 border-2 transition-all overflow-hidden ${
        achieved
          ? "bg-gradient-to-r from-success-50 via-success-50/80 to-white border-success-400 shadow-lg shadow-success-200/40"
          : "bg-white/90 border-primary-200 hover:border-primary-400 hover:shadow-xl hover:shadow-primary-200/30"
      }`}
    >
      {achieved && (
        <div className="absolute top-2 right-3 text-3xl drop-shadow-lg" aria-hidden="true">
          {milestone.icon}
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-md ${milestone.tierClass}`}>
          {milestone.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-neutral-900">{milestone.title}</h3>
            {achieved && <Badge variant="success" size="sm">✓ Đạt</Badge>}
          </div>
          <Badge variant={achieved ? "success" : "info"} size="sm">
            {milestone.reward}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="w-full bg-neutral-200/60 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                achieved
                  ? "bg-gradient-to-r from-success-400 to-success-500"
                  : "bg-gradient-to-r from-primary-500 via-accent-400 to-accent-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-bold text-neutral-700 min-w-[55px] text-right">
          {Math.min(currentStreak, milestone.days)}/{milestone.days}
        </span>
      </div>

      {!achieved && (
        <p className="text-xs text-neutral-500 mt-2">Còn {milestone.days - currentStreak} ngày nữa</p>
      )}
    </div>
  );
}

export default function CheckInPage() {
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const currentStreak = status?.currentStreak ?? 0;
  const longestStreak = status?.longestStreak ?? 0;
  const totalCheckIns = status?.totalCheckIns ?? 0;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative blobs — Gamification vibes (ui-color-harmony 60-30-10 accent) */}
      <div
        className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-accent-300 opacity-20 blur-3xl animate-blob"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-primary-300 opacity-20 blur-3xl animate-blob animation-delay-2000"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 right-1/4 h-60 w-60 rounded-full bg-pink-300 opacity-15 blur-3xl animate-blob"
        aria-hidden="true"
      />

      <main className="max-w-3xl mx-auto relative">
        {/* Header — gradient accent */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 px-5 py-2 text-sm font-bold text-primary-800 mb-4 shadow-sm border border-primary-200/60">
            <span aria-hidden="true">📅</span> Điểm danh & Streak
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Điểm danh hằng ngày</h1>
          <p className="text-base text-neutral-600">
            Điểm danh bằng 1 trong 2 cách bên dưới để nhận EXP và duy trì chuỗi học.
          </p>
        </div>

        {/* Quick stats — Color blocks (mỗi stat 1 màu khác nhau) */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 border-2 border-primary-400/50 p-4 text-center shadow-lg shadow-primary-300/30">
            <div className="text-3xl font-bold text-white">{currentStreak}</div>
            <div className="text-xs font-semibold text-primary-100 mt-1">🔥 Chuỗi hiện tại</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 border-2 border-accent-400/50 p-4 text-center shadow-lg shadow-accent-300/30">
            <div className="text-3xl font-bold text-white">{longestStreak}</div>
            <div className="text-xs font-semibold text-accent-100 mt-1">⭐ Kỷ lục</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-success-500 to-success-600 border-2 border-success-400/50 p-4 text-center shadow-lg shadow-success-300/30">
            <div className="text-3xl font-bold text-white">{totalCheckIns}</div>
            <div className="text-xs font-semibold text-success-100 mt-1">✅ Tổng ngày</div>
          </div>
        </div>

        {/* Two check-in methods — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {/* Method 1: Daily Check-in */}
          <DailyCheckIn onCheckIn={setStatus} onStatusLoaded={setStatus} />

          {/* Method 2: Complete exercise */}
          <Card className="flex flex-col justify-between border-accent-300/60 bg-gradient-to-br from-accent-50/60 via-white to-accent-100/30">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-500 text-xl shadow-md shadow-accent-300/30">
                  <span aria-hidden="true">🎯</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Hoàn thành bài tập</h3>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Làm xong 1 bài tập bất kỳ trong ngày cũng tự động ghi nhận điểm danh.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="info" size="sm">💎 +Diamonds</Badge>
                <Badge variant="info" size="sm">⚡ +EXP</Badge>
                <Badge variant="info" size="sm">🔥 +Streak</Badge>
              </div>
            </div>

            <Link
              href="/exercises"
              className="mt-5 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(234,88,12,0.4)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
            >
              Chọn bài tập →
            </Link>
          </Card>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-400 to-transparent" />
          <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Cột mốc Streak</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-400 to-transparent" />
        </div>

        {/* Streak milestones */}
        <div className="space-y-3 mb-6">
          {STREAK_MILESTONES.map((milestone) => (
            <StreakMilestoneCard
              key={milestone.days}
              milestone={milestone}
              currentStreak={currentStreak}
            />
          ))}
        </div>

        {/* Note */}
        <div className="rounded-2xl bg-gradient-to-r from-primary-50/80 to-accent-50/60 border-2 border-primary-200/60 px-5 py-4 shadow-sm">
          <p className="text-sm text-neutral-700">
            <span className="font-bold">💡 Lưu ý:</span>{" "}
            Điểm danh chỉ tính 1 lần/ngày. Làm bài tập cũng tự động ghi nhận streak.
          </p>
        </div>
      </main>
    </div>
  );
}
