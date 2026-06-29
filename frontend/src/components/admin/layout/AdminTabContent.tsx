"use client";

import BadgeManagement from "@/components/admin/BadgeManagement";
import AudioManagement from "@/components/admin/AudioManagement";
import ExerciseManagement from "@/components/admin/ExerciseManagement";
import MinimalPairManagement from "@/components/admin/MinimalPairManagement";
import PhonemeManagement from "@/components/admin/PhonemeManagement";
import QuestionBankManagement from "@/components/admin/QuestionBankManagement";
import ReportsAnalytics from "@/components/admin/ReportsAnalytics";
import SentenceItemManagement from "@/components/admin/SentenceItemManagement";
import SoundGroupManagement from "@/components/admin/SoundGroupManagement";
import TopicLevelMapManagement from "@/components/admin/TopicLevelMapManagement";
import UserManagement from "@/components/admin/UserManagement";
import WordItemManagement from "@/components/admin/WordItemManagement";
import AdminSubTabs from "./AdminSubTabs";
import OverviewDashboard from "./OverviewDashboard";
import { contentTabs, exerciseTabs, gamificationTabs } from "./admin-tabs";
import type { AdminTab } from "./types";
import type { AdminDashboardData } from "../AdminDashboardClient";

type AdminTabContentProps = {
  activeTab: AdminTab;
  data: AdminDashboardData;
  onSelectTab: (tab: AdminTab) => void;
};

/**
 * Routes the active top-level tab to the right management component
 * (or to OverviewDashboard / AdminSubTabs group).
 */
export default function AdminTabContent({ activeTab, data, onSelectTab }: AdminTabContentProps) {
  if (activeTab === "overview") {
    return <OverviewDashboard data={data} onSelectTab={onSelectTab} />;
  }

  if (activeTab === "users") return <UserManagement users={data.users} />;

  if (activeTab === "exercises") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={exerciseTabs} onSelectTab={onSelectTab} />
        <ExerciseManagement
          exercises={data.exercises}
          topics={data.exerciseOptions.topics}
          levels={data.exerciseOptions.levels}
          maps={data.exerciseOptions.maps}
          questionTypes={data.exerciseOptions.questionTypes}
        />
      </>
    );
  }

  if (activeTab === "audio") return <AudioManagement audioFiles={data.audioFiles} />;
  if (activeTab === "reports") return <ReportsAnalytics data={data.reports} />;
  if (activeTab === "topics") {
    return (
      <>
        <AdminSubTabs activeTab={activeTab} items={contentTabs} onSelectTab={onSelectTab} />
        <TopicLevelMapManagement topics={data.topics} levels={data.levels} maps={data.maps} />
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

  return (
    <>
      <AdminSubTabs activeTab={activeTab} items={gamificationTabs} onSelectTab={onSelectTab} />
      <BadgeManagement badges={data.badges} />
    </>
  );
}
