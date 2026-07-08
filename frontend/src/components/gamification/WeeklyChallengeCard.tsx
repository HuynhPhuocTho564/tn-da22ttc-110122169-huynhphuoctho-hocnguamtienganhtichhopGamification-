"use client";

import { useEffect, useState, useCallback } from "react";
import { MS_PER_DAY, MS_PER_HOUR } from "@/lib/gamification/constants";

type ChallengeData = {
  challenge: {
    id: string;
    title: string;
    description: string;
    targetMetric: string;
    targetValue: number;
    rewardGems: number;
    endsAt: string;
  };
  participation: {
    progress: number;
    completed: boolean;
    claimedAt: string | null;
  };
  topParticipants: {
    username: string;
    avatarUrl: string | null;
    progress: number;
  }[];
};

/**
 * WeeklyChallengeCard — Displays the current week's challenge
 * with user progress, claim button, leaderboard, and countdown timer.
 */
export default function WeeklyChallengeCard() {
  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const fetchChallenge = useCallback(async () => {
    try {
      const res = await fetch("/api/weekly-challenges");
      const payload = await res.json();
      if (payload.success) {
        setData(payload.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  // Countdown timer
  useEffect(() => {
    if (!data?.challenge.endsAt) return;

    const updateTimer = () => {
      const end = new Date(data.challenge.endsAt).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Đã kết thúc");
        return;
      }
      const days = Math.floor(diff / MS_PER_DAY);
      const hours = Math.floor((diff % MS_PER_DAY) / MS_PER_HOUR);
      setTimeLeft(`${days} ngày ${hours} giờ`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60_000);
    return () => clearInterval(interval);
  }, [data?.challenge.endsAt]);

  const handleClaim = async () => {
    setIsClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch("/api/weekly-challenges/claim", {
        method: "POST",
      });
      const payload = await res.json();
      if (payload.success) {
        // Refresh challenge data to show claimed state
        await fetchChallenge();
      } else {
        setClaimError(payload.error?.message ?? "Không thể nhận thưởng");
      }
    } catch {
      setClaimError("Không thể nhận thưởng. Vui lòng thử lại.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 animate-pulse" aria-busy="true">
        <div className="mb-3 h-4 w-32 rounded bg-neutral-200" />
        <div className="mb-2 h-6 w-48 rounded bg-neutral-200" />
        <div className="h-3 w-40 rounded bg-neutral-100" />
      </div>
    );
  }

  if (error || !data) return null;

  const { challenge, participation } = data;
  const progressPercent = Math.min(100, Math.round((participation.progress / challenge.targetValue) * 100));
  const metricLabel: Record<string, string> = {
    streak: "🔥 Chuỗi ngày",
    exercises: "📚 Bài tập",
    perfect_scores: "🎯 Điểm 90%+",
    xp_weekly: "⭐ EXP",
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-end">
        <span className="text-xs font-semibold text-amber-600" aria-label={`Còn lại ${timeLeft}`}>
          ⏱ {timeLeft}
        </span>
      </div>

      {/* Title + Description */}
      <h3 className="mb-1 text-lg font-bold text-neutral-900">{challenge.title}</h3>
      <p className="mb-4 text-sm text-neutral-600">{challenge.description}</p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs font-semibold">
          <span className="text-neutral-600">
            {metricLabel[challenge.targetMetric] ?? challenge.targetMetric}
          </span>
          <span className="text-amber-700">
            {participation.progress}/{challenge.targetValue}
          </span>
        </div>
        <div
          className="relative h-2.5 w-full rounded-full bg-amber-100 overflow-hidden"
          role="progressbar"
          aria-label="Tiến độ thử thách tuần"
          aria-valuemin={0}
          aria-valuemax={challenge.targetValue}
          aria-valuenow={participation.progress}
        >
          <div
            className="h-2.5 rounded-full bg-amber-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {progressPercent >= 80 && !participation.completed && (
          <p className="mt-1 text-xs font-semibold text-amber-600">
            Sắp hoàn thành! 🔥
          </p>
        )}
      </div>

      {/* Reward + Claim button */}
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
          🎁 {challenge.rewardGems} 💎
        </span>
        {participation.completed && !participation.claimedAt && (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="rounded-lg bg-success-500 px-4 py-2 text-xs font-bold text-white
                       shadow-sm hover:bg-success-600 hover:scale-[1.02]
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClaiming ? "Đang xử lý..." : `🎁 Nhận ${challenge.rewardGems} 💎`}
          </button>
        )}
        {participation.completed && !participation.claimedAt && !isClaiming && (
          <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            ✅ Hoàn thành!
          </span>
        )}
        {participation.claimedAt && (
          <span className="rounded-lg bg-success-100 px-2.5 py-1 text-xs font-bold text-success-700">
            ✓ Đã nhận
          </span>
        )}
      </div>

      {/* Claim error message */}
      {claimError && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          ⚠️ {claimError}
        </p>
      )}
    </div>
  );
}
