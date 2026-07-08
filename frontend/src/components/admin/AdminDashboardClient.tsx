"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "./layout/AdminSidebar";
import AdminTabContent from "./layout/AdminTabContent";
import AdminTopbar from "./layout/AdminTopbar";
import DateFilter from "./layout/DateFilter";
import PageHeader from "./layout/PageHeader";
import HorizontalTabs from "./layout/HorizontalTabs";
import { classNames, normalizeSearch } from "./layout/admin-utils";
import { sidebarSections } from "./layout/sidebar-sections";
import { tabMeta } from "./layout/tab-meta";
import { mapsTabs } from "./layout/maps-tabs";
import type { AdminIdentity, AdminTab } from "./layout/types";
import { type AdminBadge } from "@/components/admin/BadgeManagement";
import { type AdminAudioFile } from "@/components/admin/AudioManagement";
import { type DailyQuestLog } from "@/components/admin/DailyQuestManagement";
import { type AdminExercise } from "@/components/admin/ExerciseManagement";
import { type LeaderboardEntry, type SeasonTransition } from "@/components/admin/LeaderboardManagement";
import { type AdminMinimalPair } from "@/components/admin/MinimalPairManagement";
import { type AdminPhoneme } from "@/components/admin/PhonemeManagement";
import { type AdminQuestionBankItem } from "@/components/admin/QuestionBankManagement";
import { type AdminReportsData } from "@/components/admin/ReportsAnalytics";
import { type AdminSentenceItem } from "@/components/admin/SentenceItemManagement";
import { type AdminSoundGroup } from "@/components/admin/SoundGroupManagement";
import { type SpinWheelLog } from "@/components/admin/SpinWheelManagement";
import {
  type AdminLevelItem,
  type AdminMapItem,
  type AdminTopicItem,
} from "@/components/admin/TopicLevelMapManagement";
import { type AdminUser } from "@/components/admin/UserManagement";
import { type AdminWordItem } from "@/components/admin/WordItemManagement";

// Re-export shared types so external consumers (e.g. app/admin/page.tsx)
// can keep importing them from AdminDashboardClient.
export type { AdminIdentity, AdminTab } from "./layout/types";

export type AdminExerciseOption = {
  id: string;
  name: string;
};

export type AdminDashboardData = {
  rangeDays: number;
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalExercises: number;
    totalQuestions: number;
    completedAttempts: number;
    newUsersLast7Days: number;
    completedAttemptsLast7Days: number;
  };
  dailyActivity: Array<{
    label: string;
    newUsers: number;
    attempts: number;
  }>;
  mapsProgress: Array<{
    id: string;
    name: string;
    status: string;
    startedUsers: number;
    completionRate: number;
    exerciseCount: number;
    /** v4: null = always open (no fog). Otherwise ID of the prereq map. */
    requiredMapId: string | null;
    /** Display name of the prereq map (denormalized for UI). */
    requiredMapName: string | null;
    /** % completion of prereq map needed to unlock. 0 = always open. */
    unlockThresholdPercent: number;
  }>;
  users: AdminUser[];
  exercises: AdminExercise[];
  topics: AdminTopicItem[];
  levels: AdminLevelItem[];
  maps: AdminMapItem[];
  exerciseOptions: {
    topics: AdminExerciseOption[];
    levels: AdminExerciseOption[];
    maps: AdminExerciseOption[];
    questionTypes: AdminExerciseOption[];
  };
  audioFiles: AdminAudioFile[];
  phonemes: AdminPhoneme[];
  wordItems: AdminWordItem[];
  soundGroups: AdminSoundGroup[];
  questionBankItems: AdminQuestionBankItem[];
  minimalPairs: AdminMinimalPair[];
  sentenceItems: AdminSentenceItem[];
  badges: AdminBadge[];
  shopItems: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    cost: number;
    category: string;
    sortOrder: number;
    status: string;
  }>;
  reports: AdminReportsData;
  spinWheelLogs: SpinWheelLog[];
  dailyQuests: DailyQuestLog[];
  leaderboard: LeaderboardEntry[];
  seasonTransitions: SeasonTransition[];
};

const SIDEBAR_WIDTH_CLASS = "lg:pl-72";

export default function AdminDashboardClient({ data, admin }: { data: AdminDashboardData; admin?: AdminIdentity }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  // Holds scroll position captured at tab-change time; restored in useLayoutEffect below.
  const pendingScrollYRef = useRef<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const filteredSections = useMemo(() => {
    const query = normalizeSearch(navSearch);
    if (!query) return sidebarSections;

    return sidebarSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => normalizeSearch(`${item.name} ${item.description} ${item.id}`).includes(query)),
      }))
      .filter((section) => section.items.length > 0);
  }, [navSearch]);

  function selectTab(tab: AdminTab) {
    // Capture scroll position BEFORE state change so we can restore it
    // after the new tab content renders. Without this, switching to a map
    // tab causes HorizontalTabs to appear above main, which shifts content
    // and the browser auto-scrolls down to maintain visual position.
    pendingScrollYRef.current = window.scrollY;
    setActiveTab(tab);
    setIsSidebarOpen(false);
  }

  // Restore scroll position after tab change + layout settle.
  // useLayoutEffect fires synchronously after DOM mutation but before paint,
  // so the user never sees the scroll jump.
  useLayoutEffect(() => {
    if (pendingScrollYRef.current !== null) {
      window.scrollTo(0, pendingScrollYRef.current);
      pendingScrollYRef.current = null;
    }
  }, [activeTab]);

  // Check if current tab should show horizontal tabs for Maps
  const isMapTab = ["map_vowels", "map_consonants", "map_minimal_pairs", "map_stress_linking"].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <AdminSidebar
        activeTab={activeTab}
        admin={admin}
        filteredSections={filteredSections}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectTab={selectTab}
      />

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Đóng menu admin"
        />
      )}

      <div className={classNames("min-h-screen", SIDEBAR_WIDTH_CLASS)}>
        <AdminTopbar
          admin={admin}
          navSearch={navSearch}
          onMenuClick={() => setIsSidebarOpen(true)}
          onNavSearchChange={setNavSearch}
        />
        
        {/* Horizontal tabs for Maps section */}
        {isMapTab && (
          <HorizontalTabs
            tabs={mapsTabs}
            activeTab={activeTab}
            onTabChange={(tabId) => selectTab(tabId as AdminTab)}
          />
        )}
        
        <main className="px-4 py-5 sm:px-6">
          <PageHeader
            activeTab={activeTab}
            actions={
              activeTab === "overview" ? (
                <DateFilter
                  defaultFrom={new Date(Date.now() - (data.rangeDays - 1) * 86400000).toISOString().slice(0, 10)}
                  defaultTo={new Date().toISOString().slice(0, 10)}
                />
              ) : undefined
            }
          />
          <section aria-label={tabMeta[activeTab]?.title ?? "Admin section"}>
            <AdminTabContent activeTab={activeTab} data={data} onSelectTab={selectTab} />
          </section>
        </main>
      </div>
    </div>
  );
}
