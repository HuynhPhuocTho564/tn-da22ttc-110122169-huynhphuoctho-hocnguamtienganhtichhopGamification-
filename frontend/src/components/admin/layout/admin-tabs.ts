/**
 * Tab group definitions for AdminSubTabs.
 *
 * Three groups of related sub-tabs are rendered inside the content/exercise
 * sections of the admin dashboard. The gamification group was removed in
 * PLAN/ADMIN_DASHBOARD_new.md cleanup — gamification tabs are now reached via
 * the sidebar dropdown, not as in-page sub-tabs.
 */

import { ClipboardList, Database, FileQuestion, FolderTree, Layers, ListChecks, Mic } from "lucide-react";
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
  { id: "questions", name: "Ngân hàng câu", icon: FileQuestion },
];
