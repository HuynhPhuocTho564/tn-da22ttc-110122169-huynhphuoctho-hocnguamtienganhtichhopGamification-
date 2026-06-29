"use client";

/**
 * IslandNode — Card đảo TỔNG QUAN (overview).
 * Hình đảo lớn + progress + trang trí động theo thành tích.
 * Hoàn thành càng nhiều → đảo càng nở hoa, đẹp hơn.
 * nielsen H8: Minimalist overview. Goal-Gradient: thấy đảo "lớn lên".
 */

import { useMemo, type ComponentType, type CSSProperties } from "react";
import ProgressRing from "@/components/ui/ProgressRing";
import { Palmtree, Mountain, Swords, Flame, Trees, Anchor, Sailboat, Wind, Sparkles, Crown, type LucideIcon } from "lucide-react";
import { getBiomeForTopic } from "../utils/islandUtils";
import type { IslandData } from "../types/island";
import { getIslandMasteryStars, getMasteryStarsDisplay } from "@/lib/gamification/scoring-helpers";

interface IslandNodeProps {
  readonly island: IslandData;
  readonly onClick: (island: IslandData) => void;
}

// ─── Static Tailwind maps ─────────────────────────────────────

const GRADIENT: Record<string, string> = {
  vowels: "from-emerald-400 to-green-600",
  consonants: "from-blue-400 to-indigo-600",
  pairs: "from-purple-400 to-fuchsia-600",
  stress: "from-orange-400 to-red-600",
};

/**
 * Biome-specific lucide icon centered on island top face.
 * Connects biome theme to visual landmark for recognition (nielsen H6).
 */
const BIOME_ICONS: Record<string, LucideIcon> = {
  vowels: Palmtree,
  consonants: Mountain,
  pairs: Swords,
  stress: Flame,
};

/**
 * Hex colors for inline SVG fills (isometric island).
 * Mirrors --color-biome-* CSS vars in globals.css.
 */
const BIOME_SVG_COLORS: Record<string, { top: string; side: string; iconColor: string }> = {
  vowels:      { top: "#10b981", side: "#047857", iconColor: "#ecfdf5" },
  consonants:  { top: "#3b82f6", side: "#1d4ed8", iconColor: "#eff6ff" },
  pairs:       { top: "#a855f7", side: "#7c3aed", iconColor: "#faf5ff" },
  stress:      { top: "#f97316", side: "#c2410c", iconColor: "#fff7ed" },
};

// ─── Decoration system ────────────────────────────────────────

interface Decor {
  /** Emoji text, SVG path (if starts with "/"), or lucide icon name (if starts with "lucide:") */
  content: string;
  /** Horizontal: % of container width */
  x: string;
  /** Vertical: pixel from top (container height = 260px) */
  y: number;
  size: "sm" | "md" | "lg" | "xl";
  minPercent: number;
  /** When true, decoration gets ongoing `motion-safe:animate-pulse` after entry scale-in (e.g. campfire) */
  pulse?: boolean;
  /** Stage 1-4 — populated by flatMap in component, used as React key seed */
  stage?: 1 | 2 | 3 | 4;
}

/**
 * Lucide icons used as decorations, indexed by their "lucide:Name" string.
 * Each icon gets a Tailwind color hint matching its biome semantics.
 */
const LUCIDE_DECOR: Record<string, { icon: LucideIcon; colorClass: string }> = {
  Trees:    { icon: Trees,    colorClass: "text-emerald-700" },
  Mountain: { icon: Mountain, colorClass: "text-slate-700" },
  Anchor:   { icon: Anchor,   colorClass: "text-blue-800" },
  Sailboat: { icon: Sailboat, colorClass: "text-blue-700" },
  Wind:     { icon: Wind,     colorClass: "text-sky-600" },
  Sparkles: { icon: Sparkles, colorClass: "text-amber-500" },
  Swords:   { icon: Swords,   colorClass: "text-purple-700" },
  Crown:    { icon: Crown,    colorClass: "text-yellow-500" },
  PalmTree: { icon: Palmtree, colorClass: "text-emerald-700" },
};

const DECOR_SIZE: Record<string, { emoji: string; svgW: number; svgH: number; wrapper: string }> = {
  sm: { emoji: "text-sm", svgW: 28, svgH: 40, wrapper: "h-7 w-7" },
  md: { emoji: "text-lg", svgW: 40, svgH: 56, wrapper: "h-9 w-9" },
  lg: { emoji: "text-xl", svgW: 56, svgH: 80, wrapper: "h-11 w-11" },
  xl: { emoji: "text-2xl", svgW: 72, svgH: 100, wrapper: "h-14 w-14" },
};

interface StageAssets {
  /** 1, 2, 3, or 4 — drives entry animation order */
  readonly stage: 1 | 2 | 3 | 4;
  readonly items: ReadonlyArray<Decor>;
}

/**
 * 4-stage progression per biome (vowels / consonants / pairs / stress).
 * Stage 1 (0-20%):   bare island — 2 small grass / waves / rocks.
 * Stage 2 (20-50%):  growth     — solid palm tree + tent / lighthouse + rock / swords + tent / volcano.
 * Stage 3 (50-85%):  life       — animal (parrot/dolphin/butterfly/eagle) + pulsing campfire.
 * Stage 4 (85-100%): complete   — flag + sparkles + sailboat + crown + trophy.
 *
 * Existing emoji (🌿, 🌸, 🦜, 🐒, 🌻, ...) and lucide icons (Trees, Mountain, Sailboat,
 * Crown, Anchor, ...) are PRESERVED — only reorganized into 4 stages for staggered
 * scale-in entry animation + structured progression milestones.
 */
const STAGE_MAP: Record<string, ReadonlyArray<StageAssets>> = {
  vowels: [
    { stage: 1, items: [
      { content: "🌿", x: "10%", y: 185, size: "md", minPercent: 0 },
      { content: "🌿", x: "85%", y: 170, size: "sm", minPercent: 0 },
      { content: "🌱", x: "75%", y: 210, size: "sm", minPercent: 15 },
      { content: "/illustrations/elements/palm-tree-simple.svg", x: "8%", y: 30, size: "xl", minPercent: 15 },
    ]},
    { stage: 2, items: [
      { content: "🌴", x: "50%", y: 15, size: "xl", minPercent: 20 },
      { content: "⛺", x: "50%", y: 100, size: "lg", minPercent: 25 },
      { content: "/illustrations/elements/palm-tree-simple.svg", x: "88%", y: 20, size: "xl", minPercent: 30 },
      { content: "🌸", x: "20%", y: 195, size: "md", minPercent: 30 },
      { content: "lucide:Trees", x: "60%", y: 195, size: "md", minPercent: 25 },
      { content: "lucide:Mountain", x: "20%", y: 200, size: "sm", minPercent: 40 },
    ]},
    { stage: 3, items: [
      { content: "🦜", x: "15%", y: 25, size: "lg", minPercent: 50 },
      { content: "🌺", x: "80%", y: 120, size: "md", minPercent: 50 },
      { content: "🔥", x: "70%", y: 90, size: "md", minPercent: 55, pulse: true },
      { content: "🦋", x: "70%", y: 15, size: "md", minPercent: 65 },
      { content: "lucide:Sailboat", x: "85%", y: 175, size: "md", minPercent: 55 },
      { content: "🐒", x: "90%", y: 130, size: "lg", minPercent: 80 },
      { content: "🌻", x: "30%", y: 220, size: "md", minPercent: 80 },
    ]},
    { stage: 4, items: [
      { content: "🚩", x: "50%", y: 20, size: "lg", minPercent: 85 },
      { content: "✨", x: "30%", y: 60, size: "sm", minPercent: 90 },
      { content: "✨", x: "70%", y: 70, size: "sm", minPercent: 90 },
      { content: "⛵", x: "85%", y: 175, size: "md", minPercent: 90 },
      { content: "lucide:Crown", x: "50%", y: 195, size: "lg", minPercent: 90 },
      { content: "🏆", x: "50%", y: 5, size: "xl", minPercent: 100 },
    ]},
  ],

  consonants: [
    { stage: 1, items: [
      { content: "🌊", x: "15%", y: 210, size: "md", minPercent: 0 },
      { content: "🌊", x: "80%", y: 220, size: "sm", minPercent: 0 },
      { content: "🐚", x: "10%", y: 155, size: "md", minPercent: 15 },
      { content: "⚓", x: "88%", y: 90, size: "lg", minPercent: 15 },
    ]},
    { stage: 2, items: [
      { content: "🪨", x: "20%", y: 180, size: "lg", minPercent: 20 },
      { content: "🗼", x: "50%", y: 15, size: "xl", minPercent: 25 },
      { content: "/illustrations/elements/lighthouse-simple.svg", x: "85%", y: 5, size: "xl", minPercent: 30 },
      { content: "🐟", x: "20%", y: 220, size: "md", minPercent: 30 },
      { content: "lucide:Anchor", x: "25%", y: 165, size: "md", minPercent: 25 },
      { content: "lucide:Mountain", x: "50%", y: 200, size: "sm", minPercent: 40 },
    ]},
    { stage: 3, items: [
      { content: "🐬", x: "6%", y: 80, size: "xl", minPercent: 50 },
      { content: "🦀", x: "75%", y: 180, size: "lg", minPercent: 50 },
      { content: "🔥", x: "40%", y: 90, size: "md", minPercent: 55, pulse: true },
      { content: "🐙", x: "90%", y: 140, size: "lg", minPercent: 65 },
      { content: "/illustrations/elements/boat-simple.svg", x: "10%", y: 25, size: "xl", minPercent: 65 },
      { content: "🐋", x: "5%", y: 195, size: "xl", minPercent: 80 },
      { content: "lucide:Sailboat", x: "70%", y: 160, size: "lg", minPercent: 55 },
    ]},
    { stage: 4, items: [
      { content: "🚩", x: "50%", y: 20, size: "lg", minPercent: 85 },
      { content: "✨", x: "30%", y: 60, size: "sm", minPercent: 90 },
      { content: "✨", x: "70%", y: 70, size: "sm", minPercent: 90 },
      { content: "⛵", x: "85%", y: 175, size: "md", minPercent: 90 },
      { content: "lucide:Crown", x: "50%", y: 195, size: "lg", minPercent: 90 },
      { content: "🏆", x: "50%", y: 5, size: "xl", minPercent: 100 },
    ]},
  ],

  pairs: [
    { stage: 1, items: [
      { content: "🌿", x: "12%", y: 180, size: "sm", minPercent: 0 },
      { content: "🪨", x: "85%", y: 195, size: "md", minPercent: 0 },
      { content: "/illustrations/elements/crystal-simple.svg", x: "6%", y: 35, size: "xl", minPercent: 15 },
      { content: "✨", x: "88%", y: 45, size: "lg", minPercent: 15 },
    ]},
    { stage: 2, items: [
      { content: "⚔️", x: "50%", y: 15, size: "xl", minPercent: 20 },
      { content: "⛺", x: "50%", y: 100, size: "lg", minPercent: 25 },
      { content: "⛩️", x: "50%", y: 5, size: "xl", minPercent: 30 },
      { content: "✨", x: "20%", y: 140, size: "md", minPercent: 30 },
      { content: "lucide:Sparkles", x: "55%", y: 130, size: "md", minPercent: 25 },
      { content: "lucide:Swords", x: "40%", y: 175, size: "md", minPercent: 40 },
    ]},
    { stage: 3, items: [
      { content: "🦉", x: "85%", y: 130, size: "lg", minPercent: 50 },
      { content: "/illustrations/elements/crystal-simple.svg", x: "92%", y: 155, size: "xl", minPercent: 50 },
      { content: "🔥", x: "35%", y: 90, size: "md", minPercent: 55, pulse: true },
      { content: "🌙", x: "6%", y: 15, size: "xl", minPercent: 65 },
      { content: "🦋", x: "20%", y: 25, size: "lg", minPercent: 65 },
      { content: "lucide:Mountain", x: "60%", y: 110, size: "md", minPercent: 55 },
    ]},
    { stage: 4, items: [
      { content: "🚩", x: "50%", y: 20, size: "lg", minPercent: 85 },
      { content: "✨", x: "30%", y: 60, size: "sm", minPercent: 90 },
      { content: "✨", x: "70%", y: 70, size: "sm", minPercent: 90 },
      { content: "⛵", x: "85%", y: 175, size: "md", minPercent: 90 },
      { content: "🦄", x: "82%", y: 75, size: "xl", minPercent: 80 },
      { content: "💫", x: "25%", y: 45, size: "lg", minPercent: 80 },
      { content: "lucide:Crown", x: "50%", y: 165, size: "lg", minPercent: 90 },
      { content: "🏆", x: "50%", y: 5, size: "xl", minPercent: 100 },
    ]},
  ],

  stress: [
    { stage: 1, items: [
      { content: "🪨", x: "15%", y: 195, size: "md", minPercent: 0 },
      { content: "🪨", x: "82%", y: 180, size: "sm", minPercent: 0 },
      { content: "🔥", x: "55%", y: 75, size: "lg", minPercent: 15 },
      { content: "💨", x: "42%", y: 18, size: "md", minPercent: 15 },
    ]},
    { stage: 2, items: [
      { content: "🪨", x: "20%", y: 200, size: "lg", minPercent: 20 },
      { content: "🌋", x: "50%", y: 5, size: "xl", minPercent: 25 },
      { content: "/illustrations/elements/volcano-simple.svg", x: "48%", y: 20, size: "xl", minPercent: 30 },
      { content: "lucide:Mountain", x: "75%", y: 200, size: "sm", minPercent: 25 },
      { content: "lucide:Wind", x: "20%", y: 150, size: "md", minPercent: 40 },
    ]},
    { stage: 3, items: [
      { content: "⚡", x: "12%", y: 65, size: "lg", minPercent: 50 },
      { content: "🦅", x: "82%", y: 45, size: "lg", minPercent: 50 },
      { content: "🔥", x: "50%", y: 90, size: "md", minPercent: 55, pulse: true },
      { content: "🔥", x: "28%", y: 110, size: "xl", minPercent: 65 },
      { content: "🐉", x: "8%", y: 135, size: "xl", minPercent: 80 },
      { content: "⚡", x: "72%", y: 95, size: "xl", minPercent: 80 },
      { content: "lucide:Sparkles", x: "65%", y: 155, size: "md", minPercent: 55 },
    ]},
    { stage: 4, items: [
      { content: "🚩", x: "50%", y: 20, size: "lg", minPercent: 85 },
      { content: "✨", x: "30%", y: 60, size: "sm", minPercent: 90 },
      { content: "✨", x: "70%", y: 70, size: "sm", minPercent: 90 },
      { content: "⛵", x: "85%", y: 175, size: "md", minPercent: 90 },
      { content: "lucide:Crown", x: "50%", y: 200, size: "lg", minPercent: 90 },
      { content: "🏆", x: "50%", y: 5, size: "xl", minPercent: 100 },
    ]},
  ],
};

// ─── Component ────────────────────────────────────────────────

export default function IslandNode({ island, onClick }: IslandNodeProps) {
  const biome = getBiomeForTopic(island.topicId);
  const bId = biome.id;
  const gradClass = GRADIENT[bId] ?? "from-neutral-400 to-neutral-600";

  const decorations = useMemo(
    () => (STAGE_MAP[bId] ?? []).flatMap((stage) =>
      stage.items
        .filter((d) => island.completionPercent >= d.minPercent)
        .map((d) => ({ ...d, stage: stage.stage })),
    ),
    [bId, island.completionPercent],
  );

  // 🌟 Mastery Island Rule (Macro level): count bài đạt 3 sao (bestScore >= 90) / tổng bài.
  // Tính trực tiếp từ island.camps (đã có sẵn trong IslandData) — không cần thêm field.
  // Nếu total = 0 → masteryStars = 0 → display "☆☆☆".
  const countBestScore90Plus = useMemo(
    () =>
      island.camps.reduce(
        (acc, camp) =>
          acc + camp.exercises.filter((e) => (e.bestScore ?? 0) >= 90).length,
        0,
      ),
    [island.camps],
  );
  const masteryStars = getIslandMasteryStars(countBestScore90Plus, island.totalExercises);
  const masteryDisplay = getMasteryStarsDisplay(masteryStars);

  // (nextUnlockHint removed — completionPercent badge removed to fix data redundancy)

  const handleClick = () => {
    if (!island.isLocked) onClick(island);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        island.isLocked
          ? "border-transparent bg-white cursor-not-allowed"
          : "border-neutral-200/80 bg-white cursor-pointer hover:shadow-2xl hover:-translate-y-1"
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={island.isLocked ? -1 : 0}
      aria-label={island.isLocked ? `${island.name} — bị khóa` : `${island.name} — ${island.completionPercent}% hoàn thành`}
      aria-describedby={island.isLocked ? `island-${island.topicId}-lock-reason` : undefined}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
    >
      {/* ═══ ISLAND ILLUSTRATION ═══ — slate-700 (locked) hoặc biome gradient (unlocked). */}
      <div
        className={`relative flex items-center justify-center overflow-visible min-h-[320px] sm:min-h-[260px] ${
          island.isLocked ? "bg-slate-700" : `bg-gradient-to-b ${gradClass}`
        }`}
      >

        {/* ─── UNLOCKED: sky clouds + island SVG + dynamic decorations ─── */}
        {!island.isLocked && (
          <>
            {/* Sky decorations (always) */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <span className="absolute left-6 top-3 text-sm opacity-40" style={{ animation: "cloud-float 25s linear infinite" }}>☁️</span>
              <span className="absolute right-10 top-6 text-xs opacity-30" style={{ animation: "cloud-float 35s linear infinite", animationDelay: "8s" }}>☁️</span>
            </div>

            {/* Glow halo — emitted FROM island base (water reflection). Placed BEFORE SVG so it sits below. */}
            {island.completionPercent < 100 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-6 w-44 h-8 bg-cyan-300/40 blur-2xl rounded-full motion-safe:animate-pulse z-0"
                aria-hidden="true"
              />
            )}

            {/* Isometric Floating Island (inline SVG: top ellipse + 2 side faces). boat-bob animation only (glow moved to base). */}
            {(() => {
              const svgColors = BIOME_SVG_COLORS[bId] ?? BIOME_SVG_COLORS["vowels"];
              const BiomeIcon: ComponentType<{ className?: string; style?: CSSProperties; "aria-hidden"?: boolean }> =
                BIOME_ICONS[bId] ?? Trees;
              return (
                <div className={`relative z-10 ${island.completionPercent < 100 ? "motion-safe:animate-boat-bob" : ""}`}>
                  <svg
                    viewBox="0 0 200 200"
                    className="h-40 w-auto drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                    aria-hidden="true"
                  >
                    {/* Left side face (darker shade) — gives 3D depth */}
                    <path
                      d="M 35 130 Q 100 145 165 130 L 158 142 Q 100 155 42 142 Z"
                      fill={svgColors.side}
                      opacity="0.9"
                    />
                    {/* Right side face — slight angle for isometric perspective */}
                    <path
                      d="M 165 130 Q 100 145 35 130 L 35 138 L 100 152 L 165 138 Z"
                      fill={svgColors.side}
                      opacity="0.7"
                    />
                    {/* Top face — grass/sand ellipse (the island surface) */}
                    <ellipse cx="100" cy="115" rx="65" ry="20" fill={svgColors.top} />
                  </svg>
                  {/* Biome landmark icon — centered on island top face */}
                  <BiomeIcon
                    className={`absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 h-16 w-16 drop-shadow-lg z-20`}
                    style={{ color: svgColors.iconColor }}
                    aria-hidden={true}
                  />
                </div>
              );
            })()}

            {/* Dynamic decorations — appear as you progress (4 stages × 4 biomes).
                Outer wrapper handles staggered scale-in entry; inner wrapper handles
                bubble styling + optional ongoing pulse (campfire). Splitting them keeps
                `animationDelay` scoped to entry only. */}
            <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
              {decorations.map((d, i) => {
                const sz = DECOR_SIZE[d.size];
                const isSvg = d.content.startsWith("/");
                const isLucide = d.content.startsWith("lucide:");
                const lucideName = isLucide ? d.content.slice("lucide:".length) : "";
                const LucideDecor = isLucide ? LUCIDE_DECOR[lucideName] : undefined;

                return (
                  <div
                    key={`${bId}-s${d.stage}-${i}`}
                    className="absolute animate-[scale-in_0.5s_ease-out] motion-reduce:animate-none"
                    style={{
                      left: d.x,
                      top: d.y,
                      transform: "translate(-50%, -50%)",
                      animationDelay: `${(island.completionPercent - d.minPercent) * 20}ms`,
                    }}
                  >
                    <div
                      className={`flex items-center justify-center ${
                        d.pulse ? "motion-safe:animate-pulse" : ""
                      } ${
                        isSvg || isLucide ? "" : `rounded-full bg-white/60 shadow-sm backdrop-blur-[2px] ${sz.wrapper}`
                      }`}
                    >
                      {isSvg ? (
                        <img
                          src={d.content}
                          alt=""
                          className="drop-shadow-lg"
                          style={{ width: sz.svgW, height: sz.svgH, objectFit: "contain" }}
                        />
                      ) : isLucide && LucideDecor ? (
                        <LucideDecor.icon
                          className={`${sz.wrapper} ${LucideDecor.colorClass} drop-shadow-md`}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className={sz.emoji}>{d.content}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ─── LOCKED: nhiều mây rải rác + 2 dòng text ở giữa (Fog of War thuần) ─── */}
        {island.isLocked && (
          <>
            {/* Lớp mây dày — 14 SVG cloud + 4 emoji, puffy mượt hơn Lucide */}
            <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
              {/* ─── 6 SVG cloud LỚN (140-170px, blur(1px), puffy) — 4 góc + 2 cạnh ─── */}
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute drop-shadow-2xl" style={{ left: "3%", top: 15, width: 140, height: 70, opacity: 0.75, animation: "cloud-float 45s linear infinite", animationDelay: "0s", filter: "blur(1px)" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute drop-shadow-2xl" style={{ right: "5%", top: 25, width: 160, height: 80, opacity: 0.7, animation: "cloud-float 55s linear infinite", animationDelay: "8s", filter: "blur(1px)" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute drop-shadow-2xl" style={{ left: "8%", bottom: 25, width: 150, height: 75, opacity: 0.65, animation: "cloud-float 50s linear infinite", animationDelay: "15s", filter: "blur(1px)" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute drop-shadow-2xl" style={{ right: "10%", bottom: 35, width: 170, height: 85, opacity: 0.7, animation: "cloud-float 60s linear infinite", animationDelay: "4s", filter: "blur(1px)" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute drop-shadow-2xl" style={{ left: "35%", top: 10, width: 130, height: 65, opacity: 0.6, animation: "cloud-float 40s linear infinite", animationDelay: "20s", filter: "blur(1px)" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute drop-shadow-2xl" style={{ left: "40%", bottom: 15, width: 145, height: 72, opacity: 0.6, animation: "cloud-float 48s linear infinite", animationDelay: "25s", filter: "blur(1px)" }} />

              {/* ─── 4 SVG cloud VỪA (90-110px, fill middle) ─── */}
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ left: "22%", top: 90, width: 100, height: 50, opacity: 0.55, animation: "cloud-float 35s linear infinite", animationDelay: "3s" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ right: "22%", top: 100, width: 110, height: 55, opacity: 0.55, animation: "cloud-float 38s linear infinite", animationDelay: "11s" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ left: "5%", top: "55%", width: 90, height: 45, opacity: 0.5, animation: "cloud-float 32s linear infinite", animationDelay: "17s" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ right: "5%", top: "50%", width: 95, height: 48, opacity: 0.5, animation: "cloud-float 42s linear infinite", animationDelay: "22s" }} />

              {/* ─── 4 SVG cloud NHỎ (60-80px, fillers) ─── */}
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ left: "50%", top: 60, width: 65, height: 32, opacity: 0.45, animation: "cloud-float 28s linear infinite", animationDelay: "6s" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ right: "40%", top: 170, width: 70, height: 35, opacity: 0.5, animation: "cloud-float 30s linear infinite", animationDelay: "13s" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ left: "15%", top: 200, width: 60, height: 30, opacity: 0.45, animation: "cloud-float 26s linear infinite", animationDelay: "19s" }} />
              <img src="/illustrations/elements/cloud.svg" alt="" className="absolute" style={{ right: "18%", bottom: 60, width: 75, height: 38, opacity: 0.5, animation: "cloud-float 33s linear infinite", animationDelay: "7s" }} />

              {/* ─── 4 emoji cloud fillers (☁️/🌫️ text-2xl cho variety) ─── */}
              <span className="absolute text-2xl" style={{ left: "60%", top: 110, opacity: 0.7, animation: "cloud-float 28s linear infinite", animationDelay: "9s" }}>☁️</span>
              <span className="absolute text-xl" style={{ left: "30%", top: 200, opacity: 0.6, animation: "cloud-float 32s linear infinite", animationDelay: "21s" }}>🌫️</span>
              <span className="absolute text-xl" style={{ right: "30%", top: 50, opacity: 0.6, animation: "cloud-float 30s linear infinite", animationDelay: "16s" }}>☁️</span>
              <span className="absolute text-2xl" style={{ left: "50%", bottom: 50, opacity: 0.65, animation: "cloud-float 34s linear infinite", animationDelay: "24s" }}>🌫️</span>
            </div>

            {/* Text 2 dòng ở giữa — bọc trong khung kính mờ (Glassmorphism) để mây không che chữ */}
            <div
              id={`island-${island.topicId}-lock-reason`}
              className="relative z-20 flex max-w-[80%] flex-col items-center rounded-xl border border-slate-700/50 bg-slate-900/40 px-6 py-3 text-center backdrop-blur-sm"
            >
              <p className="text-base font-semibold text-slate-100 drop-shadow">
                Sương mù đang che phủ.
              </p>
              <p className="mt-2 text-sm text-slate-300 drop-shadow">
                Hoàn thành đảo Nguyên Âm để khám phá.
              </p>
            </div>
          </>
        )}

        {/* Progress ring — chỉ hiện khi unlocked (blueprint yêu cầu bỏ ring trên locked) */}
        {!island.isLocked && (
          <div className="absolute bottom-3 right-3 z-30">
            <div className="relative h-14 w-14">
              <ProgressRing
                percent={island.completionPercent}
                size={56}
                strokeWidth={4}
                colorClass="text-white"
                trackClass="text-white/30"
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-white">
                <span>{island.completionPercent}%</span>
                {/* 🌟 Mastery stars — Macro level (count of 90+ scores / total).
                    Locked islands đã bị guard bởi !island.isLocked bên ngoài. */}
                {island.totalExercises > 0 && (
                  <span
                    className={`text-[10px] tracking-tighter ${masteryDisplay.colorClass}`}
                    aria-label={`Mastery: ${masteryDisplay.display}`}
                  >
                    {masteryDisplay.display}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Camp count — hidden on locked islands (irrelevant; user can't access camps). */}
        {!island.isLocked && (
          <div className="absolute bottom-3 left-3 z-30 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            ⛺ {island.completedCamps}/{island.totalCamps}
          </div>
        )}
      </div>

      {/* ═══ INFO BAR ═══ — text-only khi locked (không bg-slate-300, không viền).
          Typography: heading bold + body normal. NO gray, all on light=dark neutral-900, on dark=white. */}
      <div className={`flex items-center justify-between px-5 py-4`}>
        <div className="min-w-0 flex-1">
          <h3 className={`text-xl font-bold truncate ${island.isLocked ? "text-slate-400" : "text-neutral-900"}`}>
            {biome.icon} {island.name}
          </h3>
          <p className={`mt-1 text-base font-normal truncate ${island.isLocked ? "text-slate-400" : "text-neutral-900"}`}>
            {island.description}
          </p>
          {/* Linear progress bar — bổ sung cho ProgressRing ở góc, hiển thị tiến độ rõ ràng hơn */}
          {!island.isLocked && (
            <div className="mt-3" aria-label={`Tiến độ ${island.completionPercent}%`}>
              <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
                <span>Tiến độ</span>
                <span className="text-neutral-900">{island.completionPercent}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${island.completionPercent}%` }}
                  role="progressbar"
                  aria-valuenow={island.completionPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          {/* Goal-Gradient Effect: journey-style encouragement removed — completionPercent already shown in ProgressRing + linear bar (data redundancy). */}
        </div>
        {!island.isLocked && (
          <span className="ml-3 shrink-0 rounded-lg bg-primary-100 px-4 py-2 text-base font-bold text-primary-800 transition group-hover:bg-primary-200">
            Khám phá đảo →
          </span>
        )}
      </div>
    </div>
  );
}
