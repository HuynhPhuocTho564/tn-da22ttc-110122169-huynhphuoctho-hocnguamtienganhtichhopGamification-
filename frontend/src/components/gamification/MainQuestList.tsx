"use client";

import { useEffect, useState, useCallback } from "react";
import MainQuestCard from "@/components/gamification/MainQuestCard";

interface QuestItem {
  id: string;
  name: string;
  completed: boolean;
  claimedAt: string | null;
}

interface Quest {
  type: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardGems: number;
  items: QuestItem[];
}

interface MainQuestsData {
  quests: Quest[];
}

export default function MainQuestList() {
  const [data, setData] = useState<MainQuestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchQuests = useCallback(async () => {
    try {
      const res = await fetch("/api/main-quests");
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
    fetchQuests();
  }, [fetchQuests]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-5 animate-pulse"
            aria-busy="true"
          >
            <div className="mb-3 h-4 w-32 rounded bg-neutral-200" />
            <div className="mb-2 h-6 w-48 rounded bg-neutral-200" />
            <div className="h-3 w-40 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="space-y-3">
      {data.quests.map((quest) => (
        <MainQuestCard
          key={quest.type}
          type={quest.type}
          title={quest.title}
          description={quest.description}
          rewardXp={quest.rewardXp}
          rewardGems={quest.rewardGems}
          items={quest.items}
        />
      ))}
    </div>
  );
}
