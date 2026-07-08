/**
 * Sidebar section definition.
 *
 * Implements PLAN/ADMIN_DASHBOARD_new.md — 5 compact sidebar items with
 * two navigation patterns:
 * - "Nội dung" (type: "tabs") triggers the 4 horizontal Learning Map tabs
 *   configured in `./maps-tabs.ts` (Nguyên âm, Phụ âm, Minimal Pairs, Trọng âm).
 * - "Gamification" (type: "dropdown") expands to 5 items configured in
 *   `./gamification-dropdown.ts` (Badges, Shop Items, Spin Wheel, Nhiệm vụ, Xếp hạng).
 * - "Tổng quan", "Người dùng", "Báo cáo" are direct routes (type: "default").
 */

import {
  BarChart3,
  LayoutDashboard,
  Map,
  Trophy,
  Users,
} from "lucide-react";
import type { SidebarSection } from "./types";

export const sidebarSections: SidebarSection[] = [
  {
    label: "Quản trị",
    items: [
      {
        id: "overview",
        name: "Tổng quan",
        description: "Metrics & system overview",
        icon: LayoutDashboard,
        type: "default",
      },
      {
        id: "users",
        name: "Người dùng",
        description: "User accounts & roles",
        icon: Users,
        type: "default",
      },
      {
        id: "map_vowels",
        name: "Nội dung",
        description: "5 Learning Maps hierarchy",
        icon: Map,
        type: "tabs",
      },
      {
        id: "badges",
        name: "Gamification",
        description: "Badges, Shop, Spin Wheel, Quests, Leaderboard",
        icon: Trophy,
        type: "dropdown",
      },
      {
        id: "reports",
        name: "Báo cáo",
        description: "Analytics & exports",
        icon: BarChart3,
        type: "default",
      },
    ],
  },
];
