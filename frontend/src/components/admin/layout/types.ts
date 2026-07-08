/**
 * Shared types for admin layout components.
 *
 * Centralizes types used across AdminSidebar, AdminSubTabs, AdminTopbar, etc.
 */

import type { LucideIcon } from "lucide-react";

export type AdminTab =
  | "overview"
  | "users"
  | "reports"
  // Maps (4 horizontal tabs; map_stress_linking has nested sub-tabs)
  | "map_vowels"
  | "map_consonants"
  | "map_minimal_pairs"
  | "map_stress_linking"
  // Gamification (5 dropdown items per PLAN/ADMIN_DASHBOARD_new.md)
  | "badges"
  | "xp_levels"
  | "gems_economy"
  | "shop_items"
  | "streaks_quests"
  | "leaderboard"
  | "lucky_wheel"
  // Content resource tabs (still routable internally; not in sidebar)
  | "topics"
  | "phonemes"
  | "words"
  | "soundgroups"
  | "questions"
  | "minimalpairs"
  | "sentences"
  | "audio";

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
  type?: "default" | "tabs" | "dropdown"; // Determines navigation behavior
};

export type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

export type TabMeta = {
  title: string;
  description: string;
};
