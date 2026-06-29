/**
 * Tab group definitions for AdminSubTabs.
 *
 * Three groups of related sub-tabs are rendered inside the content/exercise/gamification
 * sections of the admin dashboard.
 */

import { Award, BookOpen, ClipboardList, Database, FileQuestion, FolderTree, Gem, Gift, Layers, ListChecks, Mic, Sparkles, TrendingUp } from "lucide-react";
import type { SidebarItem } from "./types";

export const contentTabs: Array<Pick<SidebarItem, "id" | "name" | "icon">> = [
  { id: "topics", name: "Chủ đề & Map", icon: FolderTree },
  { id: "phonemes", name: "Phoneme", icon: Mic },
  { id: "soundgroups", name: "Nhóm âm", icon: Layers },
  { id: "words", name: "Từ vựng", icon: Database },
  { id: "minimalpairs", name: "Minimal pairs", icon: ListChecks },
  { id: "sentences", name: "Câu luyện đọc", icon: ClipboardList },
];

export const exerciseTabs: Array<Pick<SidebarItem, "id" | "name" | "icon">> = [
  { id: "exercises", name: "Bài tập", icon: BookOpen },
  { id: "questions", name: "Ngân hàng câu", icon: FileQuestion },
];

export const gamificationTabs: Array<Pick<SidebarItem, "id" | "name" | "icon">> = [
  { id: "badges", name: "Huy hiệu", icon: Award },
  { id: "xp_level", name: "XP & Cấp độ", icon: TrendingUp },
  { id: "gems_streak", name: "Gems & Streak", icon: Gem },
  { id: "daily_quest", name: "Daily Quest", icon: ListChecks },
  { id: "lucky_wheel", name: "Vòng quay may mắn", icon: Gift },
];
