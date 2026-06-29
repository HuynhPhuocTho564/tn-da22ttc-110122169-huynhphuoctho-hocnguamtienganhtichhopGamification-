/**
 * Shared types for admin layout components.
 *
 * Centralizes types used across AdminSidebar, AdminSubTabs, AdminTopbar, etc.
 */

import type { LucideIcon } from "lucide-react";

export type AdminTab =
  | "overview"
  | "users"
  | "exercises"
  | "topics"
  | "phonemes"
  | "words"
  | "soundgroups"
  | "questions"
  | "minimalpairs"
  | "sentences"
  | "audio"
  | "badges"
  | "xp_level"
  | "gems_streak"
  | "daily_quest"
  | "lucky_wheel"
  | "reports";

export type AdminIdentity = {
  name: string;
  email?: string | null;
  role: string;
};

export type SidebarItem = {
  id: AdminTab;
  name: string;
  description: string;
  icon: LucideIcon;
};

export type SidebarSection = {
  label: string;
  items: SidebarItem[];
};
