"use client";

import { useMemo, useState } from "react";
import AdminSidebar from "./layout/AdminSidebar";
import AdminTabContent from "./layout/AdminTabContent";
import AdminTopbar from "./layout/AdminTopbar";
import PageHeader from "./layout/PageHeader";
import { classNames, normalizeSearch } from "./layout/admin-utils";
import { sidebarSections } from "./layout/sidebar-sections";
import { tabMeta } from "./layout/tab-meta";
import type { AdminIdentity, AdminTab } from "./layout/types";
import { type AdminBadge } from "@/components/admin/BadgeManagement";
import { type AdminAudioFile } from "@/components/admin/AudioManagement";
import { type AdminExercise } from "@/components/admin/ExerciseManagement";
import { type AdminMinimalPair } from "@/components/admin/MinimalPairManagement";
import { type AdminPhoneme } from "@/components/admin/PhonemeManagement";
import { type AdminQuestionBankItem } from "@/components/admin/QuestionBankManagement";
import { type AdminReportsData } from "@/components/admin/ReportsAnalytics";
import { type AdminSentenceItem } from "@/components/admin/SentenceItemManagement";
import { type AdminSoundGroup } from "@/components/admin/SoundGroupManagement";
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
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalExercises: number;
    totalAudioFiles: number;
    completedAttempts: number;
    newUsersLast7Days: number;
    completedAttemptsLast7Days: number;
    averageScore: number;
  };
  dailyActivity: Array<{
    label: string;
    newUsers: number;
    attempts: number;
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
  reports: AdminReportsData;
};

const SIDEBAR_WIDTH_CLASS = "lg:pl-72";

export default function AdminDashboardClient({ data, admin }: { data: AdminDashboardData; admin?: AdminIdentity }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
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
    setActiveTab(tab);
    setIsSidebarOpen(false);
  }

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
        <main className="px-4 py-5 sm:px-6">
          <PageHeader activeTab={activeTab} />
          <section aria-label={tabMeta[activeTab].title}>
            <AdminTabContent activeTab={activeTab} data={data} onSelectTab={selectTab} />
          </section>
        </main>
      </div>
    </div>
  );
}
