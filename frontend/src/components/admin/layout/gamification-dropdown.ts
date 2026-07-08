/**
 * Dropdown menu configuration for the "Gamification" sidebar item.
 *
 * Implements PLAN/ADMIN_DASHBOARD_new.md — exactly 5 items, matching the
 * Hick's Law + Miller 7±2 limits for an expand-on-click dropdown.
 *
 * Tab id mapping (some items reuse legacy ids to avoid breaking internal
 * links; the display label follows the new spec):
 * - "Spin Wheel" → tab id "lucky_wheel" (kept for compatibility; UI label updated)
 * - "Nhiệm vụ"  → tab id "streaks_quests" (covers streak + daily quest mechanics)
 *
 * When a dedicated SpinWheelManagement / DailyQuestManagement component
 * is built, add the new tab ids and switch the dropdown ids accordingly.
 */

import {
  Award,
  ShoppingBag,
  Sparkles,
  ListChecks,
  Trophy,
} from "lucide-react";
import type { SidebarItem } from "./types";

export const gamificationDropdown: Array<Pick<SidebarItem, "id" | "name" | "icon" | "description">> = [
  {
    id: "badges",
    name: "Badges",
    icon: Award,
    description: "Xem/tạo/sửa/xóa huy hiệu, xem stats unlock rate",
  },
  {
    id: "shop_items",
    name: "Shop Items",
    icon: ShoppingBag,
    description: "Xem/tạo/sửa/xóa 9 shop items (Power-ups, Protection, Cosmetics)",
  },
  {
    id: "lucky_wheel",
    name: "Spin Wheel",
    icon: Sparkles,
    description: "Cấu hình vòng quay (8 ô prize + trọng số), xem lịch sử SpinWheelLog",
  },
  {
    id: "streaks_quests",
    name: "Nhiệm vụ",
    icon: ListChecks,
    description: "Quản lý template DailyQuest, xem tiến độ người dùng",
  },
  {
    id: "leaderboard",
    name: "Xếp hạng",
    icon: Trophy,
    description: "Quản lý Leaderboard, phân hạng (bronze→legend), SeasonTransitionLog",
  },
];
