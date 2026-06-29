"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

type Quest = {
  id: string;
  questType: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardXp: number;
  rewardGems: number;
};

type QuestApiResponse = {
  success: boolean;
  data?: { quests: Quest[] };
  error?: { code: string; message: string };
};

/** Quest type display labels */
const QUEST_LABELS: Record<string, string> = {
  PRACTICE_3: "Luyện 3 bài hôm nay",
  CD2_3: "Hoàn thành 3 bài CĐ2 Phụ âm",
  CD4_LINKING_3: "Hoàn thành 3 bài CĐ4 nối âm",
};

/**
 * DailyQuestsWidget - Hiển thị 3 nhiệm vụ hằng ngày trong sidebar dashboard.
 * Fetch từ /api/daily-quests (lazy generate 3 quest/ngày).
 */
export default function DailyQuestsWidget() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadQuests() {
      try {
        const response = await fetch("/api/daily-quests");
        const body = (await response.json()) as QuestApiResponse;

        if (!cancelled && body.success && body.data) {
          setQuests(body.data.quests);
        }
      } catch {
        // Silently fail - widget shows empty state
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadQuests();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <h3 className="mb-3 text-lg font-bold text-neutral-900">Nhiệm vụ hằng ngày</h3>
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-12 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-12 animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </Card>
    );
  }

  if (quests.length === 0) return null;

  const completedCount = quests.filter((q) => q.completed).length;
  const incompleteCount = quests.length - completedCount;
  const allComplete = incompleteCount === 0;

  return (
    <Card className="mb-6 border-primary-200 bg-primary-50">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-neutral-900">Nhiệm vụ hằng ngày</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${allComplete ? "text-success-600" : "text-primary-600"}`}>
            {completedCount}/{quests.length}
          </span>
          {/* Task 6.5: incomplete quest badge — "come back" hook khi user rời app (Goal-Gradient).
              Ẩn khi tất cả quests đã hoàn thành. */}
          {!allComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-bold text-accent-700">
              📋 {incompleteCount} chưa xong
            </span>
          )}
          {allComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-bold text-success-700">
              ✨ Hoàn thành
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3">
        {quests.map((quest) => {
          const progressPercent = Math.min(100, Math.round((quest.progress / quest.target) * 100));
          const label = QUEST_LABELS[quest.questType] ?? quest.questType;

          return (
            <li
              key={quest.id}
              className={`rounded-lg border p-3 transition-colors ${
                quest.completed
                  ? "border-success-200 bg-success-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-sm font-semibold ${quest.completed ? "text-success-700" : "text-neutral-800"}`}>
                  {quest.completed ? "✓ " : ""}{label}
                </span>
                <span className="text-xs font-bold text-amber-600">
                  +{quest.rewardGems}💎 +{quest.rewardXp}EXP
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-neutral-100">
                  <div
                    className={`h-1.5 rounded-full transition-all ${quest.completed ? "bg-success-500" : "bg-primary-500"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-neutral-500">
                  {quest.progress}/{quest.target}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Task 6.5: progress summary text — khuyến khích hoàn thành bonus (Goal-Gradient).
          Đổi text khi đã hoàn thành tất cả để chúc mừng. */}
      <p className={`mt-3 text-xs ${allComplete ? "font-bold text-success-700" : "text-neutral-500"}`}>
        {allComplete
          ? "🎉 Bạn đã hoàn thành tất cả nhiệm vụ hôm nay! Hẹn gặp lại ngày mai!"
          : "Hoàn thành tất cả nhiệm vụ để nhận bonus 💎 và EXP!"}
      </p>
    </Card>
  );
}
