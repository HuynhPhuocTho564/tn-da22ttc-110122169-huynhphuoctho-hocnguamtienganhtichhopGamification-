"use client";

/**
 * CampExerciseView — Hiển thị exercises trong 1 camp.
 * Tái sử dụng UI pattern từ LearningMapClient hiện tại.
 * maintainable-code: ≤ 180 dòng, delegates rendering.
 * nielsen H3: Back button rõ ràng.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Headphones, Mic, Rocket, Swords } from "lucide-react";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { getBiomeForTopic } from "../utils/islandUtils";
import { CAMP_STATE_ICONS } from "../constants/islands";
import type { CampData, ExerciseUI } from "../types/island";
import { getStarsFromScore, getStarsDisplay } from "@/lib/gamification/scoring-helpers";

interface CampExerciseViewProps {
  readonly camp: CampData;
  readonly islandTopicId: string;
  readonly onBack: () => void;
}

function getStatusVariant(status: string): BadgeVariant {
  if (status === "ACTIVE") return "success";
  if (status === "LOCKED" || status === "DRAFT") return "warning";
  if (status === "ARCHIVED") return "error";
  return "default";
}

function getStatusLabel(status: string): string {
  if (status === "ACTIVE") return "Sẵn sàng";
  if (status === "LOCKED") return "Chưa sẵn sàng";
  if (status === "DRAFT") return "Bản nháp";
  if (status === "ARCHIVED") return "Đã lưu trữ";
  return status;
}

function getExerciseIconAndLabel(exercise: { id: string; name: string }): {
  Icon: typeof Headphones;
  color: string;
  label: string;
} {
  const id = exercise.id.toLowerCase();
  const name = exercise.name.toLowerCase();

  // Specific matches FIRST so "speak_sentence" doesn't fall to "speak" → Mic.
  if (id.includes("listen") || name.includes("luyện tai") || name.includes("nghe & chọn")) {
    return { Icon: Headphones, color: "text-blue-500", label: "Luyện tai" };
  }
  if (id.includes("sentence") || id.includes("real") || name.includes("thực chiến")) {
    return { Icon: Rocket, color: "text-purple-500", label: "Thực chiến" };
  }
  if (id.includes("minimal") || id.includes("challenge") || name.includes("thử thách")) {
    return { Icon: Swords, color: "text-amber-500", label: "Thử thách kép" };
  }
  // Fallback: speak_word (Luyện miệng) hoặc không nhận diện được.
  return { Icon: Mic, color: "text-emerald-500", label: "Luyện miệng" };
}

/**
 * Short label theo mapping 60-80-90 (1-2 từ, gọn cho bottom meta).
 * - 3 sao: "Xuất sắc"
 * - 2 sao: "Giỏi"
 * - 1 sao: "Khá"
 * - 0 sao: "Cần luyện"
 * Caller đã đảm bảo bestScore !== null trước khi gọi (xem ExerciseCard bottom meta).
 */
function getShortLabel(score: number): string {
  const stars = getStarsFromScore(score);
  if (stars === 3) return "Xuất sắc";
  if (stars === 2) return "Giỏi";
  if (stars === 1) return "Khá";
  return "Cần luyện";
}

export default function CampExerciseView({
  camp,
  islandTopicId,
  onBack,
}: CampExerciseViewProps) {
  const biome = getBiomeForTopic(islandTopicId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // nielsen H2 + WCAG 2.4.3: focus the heading on mount AND when the camp
  // changes, so keyboard/screen-reader users land in the right context.
  useEffect(() => {
    headingRef.current?.focus();
  }, [camp.mapId]);

  return (
    <div className="animate-slide-up-panel">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-base font-bold text-neutral-900 shadow-sm border border-neutral-300 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
        aria-label="Quay lại đảo"
      >
        <span aria-hidden="true">←</span> Quay lại
      </button>

      {/* Camp header */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl" aria-hidden="true">{CAMP_STATE_ICONS[camp.state]}</span>
          {camp.requirement && (
            <Badge variant="info" size="sm">{camp.requirement}</Badge>
          )}
          <Badge variant={getStatusVariant(camp.status)} size="sm">
            {getStatusLabel(camp.status)}
          </Badge>
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="text-4xl font-bold tracking-tight text-neutral-900 focus:outline-none">
          {camp.name}
        </h1>
        <p className="mt-2 text-base font-normal text-neutral-900">
          Chọn dạng bài để luyện phát âm.
        </p>
        <p className="mt-1 text-sm font-normal text-neutral-900">
          {camp.totalExercises} bài tập · {camp.completedExercises} đã đạt từ 60 điểm
        </p>
        <div className="mt-4 max-w-md">
          <ProgressBar
            value={camp.completedExercises}
            max={Math.max(camp.totalExercises, 1)}
            label={`${camp.completedExercises}/${camp.totalExercises} bài hoàn thành`}
            color={camp.state === "completed" ? "success" : "primary"}
            showPercentage={camp.totalExercises > 0}
          />
        </div>
      </section>

      {/* Exercise grid */}
      {camp.exercises.length === 0 ? (
        <div className="rounded-xl border border-neutral-300 bg-white p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Chưa có bài tập</h2>
          <p className="mt-2 text-base font-normal text-neutral-900">Trại này đang được chuẩn bị nội dung.</p>
          <p className="mt-1 text-sm font-normal text-neutral-900">Vui lòng quay lại sau.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Danh sách bài tập">
          {camp.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              mapStatus={camp.status}
            />
          ))}
        </section>
      )}
    </div>
  );
}

/** Single exercise card */
function ExerciseCard({
  exercise,
  mapStatus,
}: {
  exercise: ExerciseUI;
  mapStatus: string;
}) {
  const isActive = mapStatus === "ACTIVE" && exercise.status === "ACTIVE";
  const { Icon, color, label } = getExerciseIconAndLabel(exercise);

  const content = (
    <>
      {/* TOP HEADER (Duolingo-style): Icon + Title trái | 3 sao to phải */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className={`h-7 w-7 shrink-0 ${color}`} strokeWidth={2.5} aria-hidden="true" />
          <h3 className="truncate text-2xl font-bold text-neutral-900">{label}</h3>
        </div>
        <div
          className="flex shrink-0 items-center gap-0.5 text-4xl"
          aria-label={
            exercise.bestScore === null
              ? "Chưa có điểm"
              : `Điểm ${exercise.bestScore}/100 — ${getShortLabel(exercise.bestScore)}`
          }
        >
          {[1, 2, 3].map((i) => {
            const stars = exercise.bestScore === null ? 0 : getStarsFromScore(exercise.bestScore);
            return (
              <span
                key={i}
                className={i <= stars ? "text-amber-500" : "text-slate-300"}
                aria-hidden="true"
              >
                {i <= stars ? "★" : "☆"}
              </span>
            );
          })}
        </div>
      </div>

      {/* Locked status badge (chỉ hiện khi không active) */}
      {!isActive && (
        <div className="mb-2">
          <Badge variant="warning" size="sm">
            {getStatusLabel(exercise.status)}
          </Badge>
        </div>
      )}

      <p className="min-h-[40px] text-base font-normal text-neutral-900 leading-relaxed">
        {exercise.description || "Bài tập luyện phát âm tiếng Anh."}
      </p>

      {/* BOTTOM META: gom gọn — số câu + điểm/shortLabel, hoặc 'Bắt đầu luyện' */}
      <p className="mt-2 text-sm font-normal text-neutral-900">
        {exercise.bestScore === null ? (
          <>{exercise.questionCount} câu • 🎯 Bắt đầu luyện</>
        ) : (
          <>{exercise.questionCount} câu • 🎯 {exercise.bestScore}/100 ({getShortLabel(exercise.bestScore)})</>
        )}
      </p>

      <div className={`mt-4 rounded-lg border-2 px-4 py-2.5 text-base font-bold text-center ${
        isActive
          ? "border-primary-300 bg-primary-100 text-primary-800"
          : "border-neutral-900 bg-neutral-900 text-white"
      }`}>
        {isActive ? "Bắt đầu luyện tập →" : "Nội dung chưa sẵn sàng"}
      </div>
    </>
  );

  if (!isActive) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-5 opacity-80 shadow-sm" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}

/**
 * StarsBadge — hiển thị điểm + sao theo rule 60-80-90 (Micro level).
 * - 0 sao: amber-700 (warning variant) — "Chưa đạt sao"
 * - 1 sao: default variant — "1 Sao — Pass"
 * - 2-3 sao: success variant — "Giỏi / Hoàn hảo"
 */
function StarsBadge({ score }: { score: number }) {
  const stars = getStarsFromScore(score);
  const display = getStarsDisplay(stars);
  const variant: BadgeVariant = stars >= 2 ? "success" : stars === 1 ? "default" : "warning";
  return (
    <Badge variant={variant} size="sm" className="gap-1">
      <span className={display.colorClass} aria-hidden="true">{display.emoji}</span>
      <span>{score}/100</span>
      <span className="text-xs opacity-80">— {display.label}</span>
    </Badge>
  );
}
