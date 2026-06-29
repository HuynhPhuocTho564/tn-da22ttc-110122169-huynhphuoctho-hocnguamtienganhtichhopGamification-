"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { SkeletonDailyCheckIn } from "@/components/ui/Skeleton";
import { playSfx } from "@/lib/sfx";
import { celebrate } from "@/lib/confetti";

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

type DailyCheckInProps = {
  currentStreak?: number;
  longestStreak?: number;
  totalCheckIns?: number;
  lastCheckIn?: string | null;
  canCheckIn?: boolean;
  onCheckIn?: (status: CheckInStatus) => void;
  onStatusLoaded?: (status: CheckInStatus) => void;
};

type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error?: {
        code: string;
        message: string;
      };
      data?: Partial<CheckInStatus>;
    };

const DEFAULT_REWARD = {
  xp: 10,
  rankingScore: 2,
};

/** Streak milestones — compact inline version */
const STREAK_MILESTONES = [
  { days: 3, label: "Khởi động" },
  { days: 7, label: "1 tuần bền bỉ" },
  { days: 14, label: "Nhịp ổn định" },
] as const;

/** Days with gift box rewards in the 7-day cycle */
const GIFT_DAYS = new Set([3, 5, 7]);

export default function DailyCheckIn({
  currentStreak = 0,
  longestStreak = 0,
  totalCheckIns = 0,
  lastCheckIn = null,
  canCheckIn,
  onCheckIn,
  onStatusLoaded,
}: DailyCheckInProps) {
  const [status, setStatus] = useState<CheckInStatus>({
    currentStreak,
    longestStreak,
    totalCheckIns,
    lastCheckInDate: lastCheckIn,
    canCheckIn: canCheckIn ?? false,
    todayReward: DEFAULT_REWARD,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      setIsLoading(true);
      setMessage(null);

      try {
        const response = await fetch("/api/checkin");
        const body = (await response.json()) as ApiResponse<CheckInStatus>;

        if (!cancelled && body.success) {
          setStatus(body.data);
          onStatusLoaded?.(body.data);
        }

        if (!cancelled && !body.success) {
          setMessage(body.error?.message ?? "Không lấy được trạng thái điểm danh.");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage("Không thể kết nối API điểm danh.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [onStatusLoaded]);

  async function handleCheckIn() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await response.json()) as ApiResponse<
        CheckInStatus & {
          reward: {
            xp: number;
            rankingScore: number;
          };
          badgesAwarded: Array<{
            id: string;
            name: string;
            type: string;
          }>;
        }
      >;

      if (body.success) {
        const nextStatus: CheckInStatus = {
          currentStreak: body.data.currentStreak,
          longestStreak: body.data.longestStreak,
          totalCheckIns: body.data.totalCheckIns,
          lastCheckInDate: body.data.lastCheckInDate,
          canCheckIn: false,
          todayReward: body.data.reward,
        };

        setStatus(nextStatus);
        setMessage(
          body.data.badgesAwarded.length > 0
            ? `Đã điểm danh và nhận ${body.data.badgesAwarded.length} huy hiệu mới.`
            : "Đã điểm danh thành công.",
        );
        // Fire-and-forget SFX cho check-in thành công (Chunk C1)
        playSfx("correct");
        // Streak milestone confetti (Chunk C7) — chỉ bắn khi đạt mốc 3/7/14 ngày.
        const isMilestone = STREAK_MILESTONES.some((m) => m.days === nextStatus.currentStreak);
        if (isMilestone) {
          celebrate({ particleCount: 80, spread: 90 });
        }
        onCheckIn?.(nextStatus);
      } else {
        setMessage(body.error?.message ?? "Điểm danh không thành công.");
        if (body.error?.code === "ALREADY_CHECKED_IN") {
          setStatus((current) => ({
            ...current,
            canCheckIn: false,
          }));
        }
      }
    } catch (error) {
      setMessage("Không thể kết nối API điểm danh.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const cycleDay = status.currentStreak === 0 ? 1 : ((status.currentStreak - 1) % 7) + 1;
  const weekDays = Array.from({ length: 7 }, (_, index) => ({
    day: index + 1,
    checked: cycleDay >= index + 1 && status.currentStreak > 0,
  }));

  // Skeleton loading state (Chunk C6) — tránh màn hình trắng/cục khi fetch status.
  if (isLoading) {
    return (
      <Card className="border-primary-200 bg-primary-50">
        <SkeletonDailyCheckIn />
      </Card>
    );
  }

  return (
    <Card className="border-primary-200 bg-primary-50">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="text-lg font-bold text-neutral-900">
          Chuỗi ngày học — {status.currentStreak > 0 ? `${status.currentStreak} ngày` : "Chưa bắt đầu"}
        </h3>
        {status.canCheckIn && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            Chưa học hôm nay
          </span>
        )}
        {!status.canCheckIn && status.currentStreak > 0 && (
          <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-bold text-success-700">
            ✓ Đã điểm danh
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-600 mb-4">
        Hoàn thành 1 bài tập bất kỳ để điểm danh và duy trì chuỗi.
      </p>

      {/* 7-day cycle with gift boxes */}
      <ul className="flex justify-center gap-2 sm:gap-3" aria-label="Tiến độ chu kỳ 7 ngày">
        {weekDays.map((day) => {
          const isGiftDay = GIFT_DAYS.has(day.day);
          const isToday = day.day === cycleDay && status.canCheckIn;
          return (
            <li
              key={day.day}
              className={`flex flex-col items-center gap-1 ${isToday ? "scale-110" : ""}`}
            >
              {/* Day box */}
              <div
                className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                  day.checked
                    ? "bg-success-500 text-white shadow-sm"
                    : isToday
                    ? "border-2 border-amber-400 bg-amber-50 text-amber-700"
                    : "border border-neutral-200 bg-white text-neutral-400"
                }`}
                aria-label={`Ngày ${day.day}: ${day.checked ? "Đã hoàn thành" : "Chưa hoàn thành"}`}
              >
                {day.checked ? "✓" : day.day}
              </div>

              {/* Gift icon or day label */}
              {isGiftDay ? (
                <span className={`text-base ${day.checked ? "opacity-50" : ""}`} aria-label="Phần thưởng">
                  🎁
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400">
                  {day.day === 1 ? "T2" : day.day === 2 ? "T3" : day.day === 3 ? "T4" : day.day === 4 ? "T5" : day.day === 5 ? "T6" : day.day === 6 ? "T7" : "CN"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Streak milestones — compact inline (moved from /checkin page) */}
      <div className="mt-4 flex gap-3">
        {STREAK_MILESTONES.map((m) => {
          const achieved = status.currentStreak >= m.days;
          const pct = Math.min(100, Math.round((status.currentStreak / m.days) * 100));
          return (
            <div
              key={m.days}
              className={`flex-1 rounded-lg border p-2 text-center transition-all ${
                achieved ? "border-success-300 bg-success-50" : "border-neutral-200 bg-white"
              }`}
            >
              <p className="text-xs font-bold text-neutral-700">{m.label}</p>
              <p className={`text-lg font-black ${achieved ? "text-success-600" : "text-neutral-400"}`}>
                {m.days} ngày
              </p>
              {!achieved && (
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                  <div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              )}
              {achieved && (
                <p className="mt-1 text-xs font-bold text-success-600">✓ Đạt</p>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <div
          className="mt-4 rounded-lg border border-primary-200 bg-white p-3 text-sm text-neutral-700"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}
    </Card>
  );
}
