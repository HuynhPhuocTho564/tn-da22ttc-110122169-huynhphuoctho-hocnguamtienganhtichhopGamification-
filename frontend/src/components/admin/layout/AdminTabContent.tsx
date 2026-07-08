"use client";

import { useState } from "react";
import BadgeManagement from "@/components/admin/BadgeManagement";
import AudioManagement from "@/components/admin/AudioManagement";
import DailyQuestManagement from "@/components/admin/DailyQuestManagement";
import LeaderboardManagement from "@/components/admin/LeaderboardManagement";
import MinimalPairManagement from "@/components/admin/MinimalPairManagement";
import PhonemeManagement from "@/components/admin/PhonemeManagement";
import QuestionBankManagement from "@/components/admin/QuestionBankManagement";
import ReportsAnalytics from "@/components/admin/ReportsAnalytics";
import SentenceItemManagement from "@/components/admin/SentenceItemManagement";
import ShopManagement from "@/components/admin/ShopManagement";
import type { ShopItem as ShopManagementItem } from "@/components/admin/ShopManagement";
import SoundGroupManagement from "@/components/admin/SoundGroupManagement";
import SpinWheelManagement from "@/components/admin/SpinWheelManagement";
import TopicLevelMapManagement from "@/components/admin/TopicLevelMapManagement";
import UserManagement from "@/components/admin/UserManagement";
import WordItemManagement from "@/components/admin/WordItemManagement";
import AdminSubTabs from "./AdminSubTabs";
import OverviewDashboard from "./OverviewDashboard";
import { contentTabs, exerciseTabs } from "./admin-tabs";
import type { AdminTab } from "./types";
import type { AdminDashboardData } from "../AdminDashboardClient";
import { stressLinkingSubTabs } from "./maps-tabs";

const MAP_TAB_PATTERNS: Record<string, RegExp> = {
  map_vowels: /nguyên âm|vowel/i,
  map_consonants: /phụ âm|consonant/i,
  map_minimal_pairs: /minimal/i,
};

function findTopicForTab(tab: AdminTab, topics: AdminDashboardData["topics"]) {
  const pattern = MAP_TAB_PATTERNS[tab];
  if (!pattern) return null;
  return topics.find((topic) => pattern.test(topic.name)) ?? null;
}

type AdminTabContentProps = {
  activeTab: AdminTab;
  data: AdminDashboardData;
  onSelectTab: (tab: AdminTab) => void;
};

/** Nested sub-tabs for "Trọng âm & Nối âm" */
function StressLinkingPanel({ data }: { data: AdminDashboardData }) {
  const [subTab, setSubTab] = useState<"stress" | "linking">("stress");

  // Use topic-4-stress-connected which has all exercises
  const stressLinkingTopic = data.topics.find((t) => t.id === "topic-4-stress-connected");
  const activeTopic = stressLinkingTopic;

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="border-b border-slate-200 bg-white mb-4">
        <nav className="-mb-px flex space-x-6 px-4" aria-label="Trọng âm & Nối âm sub-tabs">
          {stressLinkingSubTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === subTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id as "stress" | "linking")}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <TopicLevelMapManagement
        topics={data.topics}
        maps={data.maps}
        exercises={data.exercises}
        levels={data.levels}
        questionTypes={data.exerciseOptions.questionTypes}
        topicId={activeTopic?.id ?? null}
        topicName={activeTopic?.name ?? null}
      />
    </div>
  );
}

/**
 * Routes the active top-level tab to the right management component
 * (or to OverviewDashboard / AdminSubTabs group).
 */
export default function AdminTabContent({ activeTab, data, onSelectTab }: AdminTabContentProps) {
  if (activeTab === "overview") {
    return <OverviewDashboard data={data} onSelectTab={onSelectTab} />;
  }

  if (activeTab === "users") return <UserManagement users={data.users} />;

  if (activeTab === "audio") return <AudioManagement audioFiles={data.audioFiles} />;
  if (activeTab === "reports") return <ReportsAnalytics data={data.reports} />;

  // 3 map tabs (Nguyên âm / Phụ âm / Minimal Pairs) — render the
  // same TopicLevelMapManagement in per-map mode so each tab drills into the
  // specific LearningMap record.
  if (MAP_TAB_PATTERNS[activeTab]) {
    const targetTopic = findTopicForTab(activeTab, data.topics);
    return (
      <TopicLevelMapManagement
        topics={data.topics}
        maps={data.maps}
        exercises={data.exercises}
        levels={data.levels}
        questionTypes={data.exerciseOptions.questionTypes}
        topicId={targetTopic?.id ?? null}
        topicName={targetTopic?.name ?? null}
      />
    );
  }

  // Trọng âm & Nối âm — nested sub-tabs
  if (activeTab === "map_stress_linking") {
    return <StressLinkingPanel data={data} />;
  }

  if (activeTab === "topics") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={contentTabs} onSelectTab={onSelectTab} />
        <TopicLevelMapManagement topics={data.topics} maps={data.maps} exercises={data.exercises} levels={data.levels} questionTypes={data.exerciseOptions.questionTypes} />
      </>
    );
  }
  if (activeTab === "phonemes") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={contentTabs} onSelectTab={onSelectTab} />
        <PhonemeManagement phonemes={data.phonemes} />
      </>
    );
  }

  if (activeTab === "words") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={contentTabs} onSelectTab={onSelectTab} />
        <WordItemManagement
          items={data.wordItems}
          phonemes={data.phonemes.map((phoneme) => ({ id: phoneme.id, symbol: phoneme.symbol }))}
        />
      </>
    );
  }

  if (activeTab === "soundgroups") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={contentTabs} onSelectTab={onSelectTab} />
        <SoundGroupManagement items={data.soundGroups} topics={data.exerciseOptions.topics} />
      </>
    );
  }

  if (activeTab === "questions") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={exerciseTabs} onSelectTab={onSelectTab} />
        <QuestionBankManagement
          items={data.questionBankItems}
          questionTypes={data.exerciseOptions.questionTypes}
          soundGroups={data.soundGroups.map((soundGroup) => ({ id: soundGroup.id, name: soundGroup.name }))}
        />
      </>
    );
  }

  if (activeTab === "minimalpairs") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={contentTabs} onSelectTab={onSelectTab} />
        <MinimalPairManagement
          items={data.minimalPairs}
          soundGroups={data.soundGroups.map((soundGroup) => ({ id: soundGroup.id, name: soundGroup.name }))}
          wordItems={data.wordItems.map((wordItem) => ({ id: wordItem.id, word: wordItem.word }))}
        />
      </>
    );
  }

  if (activeTab === "sentences") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={contentTabs} onSelectTab={onSelectTab} />
        <SentenceItemManagement
          items={data.sentenceItems}
          soundGroups={data.soundGroups.map((soundGroup) => ({ id: soundGroup.id, name: soundGroup.name }))}
        />
      </>
    );
  }

  // Shop Items — dedicated management component (PLAN §2).
  if (activeTab === "shop_items") {
    return <ShopManagement items={data.shopItems as ShopManagementItem[]} />;
  }

  // Spin Wheel — config + log viewer (PLAN §3).
  if (activeTab === "lucky_wheel") {
    return <SpinWheelManagement logs={data.spinWheelLogs} />;
  }
  // Nhiệm vụ hằng ngày — templates + progress viewer (PLAN §4).
  if (activeTab === "streaks_quests") {
    return <DailyQuestManagement logs={data.dailyQuests} />;
  }
  // Bảng xếp hạng — weekly/monthly top + season transitions (PLAN §5).
  if (activeTab === "leaderboard") {
    const weekly = data.leaderboard.filter((entry) => entry.type === "tuan");
    return <LeaderboardManagement weekly={weekly} transitions={data.seasonTransitions} />;
  }

  // Default fallback — the only tab that reaches here now is `badges`
  // (handled by the gamification dropdown). All other tabs have explicit
  // branches above.
  return <BadgeManagement badges={data.badges} />;
}
