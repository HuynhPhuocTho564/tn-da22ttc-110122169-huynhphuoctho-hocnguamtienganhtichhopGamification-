/**
 * Horizontal tabs configuration for the "Nội dung" sidebar item.
 *
 * 4 horizontal tabs (≤7 per Miller 7±2):
 *   1. Nguyên âm              (tab id: map_vowels)
 *   2. Phụ âm                  (tab id: map_consonants)
 *   3. Minimal Pairs           (tab id: map_minimal_pairs)
 *   4. Trọng âm & Nối âm       (tab id: map_stress_linking)
 *      └─ Sub-tabs: Trọng âm, Nối âm
 */

import { Link2, MessageSquare, Theater, TreeDeciduous, Zap } from "lucide-react";
import type { SidebarItem } from "./types";

export const mapsTabs: Array<Pick<SidebarItem, "id" | "name" | "icon">> = [
  {
    id: "map_vowels",
    name: "Nguyên âm",
    icon: TreeDeciduous,
  },
  {
    id: "map_consonants",
    name: "Phụ âm",
    icon: MessageSquare,
  },
  {
    id: "map_minimal_pairs",
    name: "Minimal Pairs",
    icon: Theater,
  },
  {
    id: "map_stress_linking",
    name: "Trọng âm & Nối âm",
    icon: Zap,
  },
];

/** Sub-tabs inside "Trọng âm & Nối âm" */
export const stressLinkingSubTabs = [
  { id: "stress", name: "Trọng âm", icon: Zap },
  { id: "linking", name: "Nối âm", icon: Link2 },
] as const;
