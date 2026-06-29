/**
 * Island Map Type Definitions.
 * maintainable-code: cấm `any`, explicit return types, readonly everywhere.
 */

// ─── Topic UI Types ────────────────────────────────────────────
// Originally defined in LearningMapClient.tsx; moved here so that component
// file can be deleted now that the list view has been removed.
// page.tsx and other consumers still import these from this module.

export type ExerciseUI = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  questionCount: number;
  bestScore: number | null;
  isCompleted: boolean;
};

export type LearningMapUI = {
  id: string;
  name: string;
  requirement: string | null;
  status: string;
  subcategory: string | null;
  exercises: ExerciseUI[];
};

export type TopicUI = {
  id: string;
  name: string;
  description: string | null;
  maps: LearningMapUI[];
  isLocked?: boolean;
  completionPercent?: number;
  prerequisiteName?: string;
  // Mastery Island Rule (Chunk 2 → used by Chunk 3 IslandNode ProgressRing):
  /** Tổng số bài trong prereq island (count-based, không phải %). */
  totalExercises?: number;
  /** Số bài đạt 3 sao (bestScore >= 90) trong prereq island. */
  countBestScore90Plus?: number;
};

// ─── State Types ──────────────────────────────────────────────

/** Trạng thái hòn đảo (topic) */
export type IslandState = "completed" | "current" | "available" | "locked";

/** Trạng thái trại (sound group / map) */
export type CampState = "completed" | "current" | "available" | "locked";

/** Sức khỏe đảo — phản ánh hoạt động gần đây */
export type IslandHealth = "thriving" | "healthy" | "wilting" | "dormant";

// ─── Data Types ───────────────────────────────────────────────

/** Dữ liệu 1 hòn đảo cho UI — transform từ TopicUI */
export interface IslandData {
  readonly topicId: string;
  readonly name: string;
  readonly description: string;
  readonly state: IslandState;
  readonly completionPercent: number;
  /** Progress of the prerequisite island (page.tsx populates this for topics
   *  that have an unlock threshold). Undefined when the topic has no prereq
   *  (e.g. Đảo Nguyên Âm). Used to show "🧭 64% → mở" on locked islands. */
  readonly prerequisiteCompletionPercent?: number;
  readonly totalCamps: number;
  readonly completedCamps: number;
  readonly totalExercises: number;
  readonly completedExercises: number;
  readonly camps: CampData[];
  readonly isLocked: boolean;
  readonly prerequisiteName?: string;
}

/** Dữ liệu 1 trại (sound group) cho UI — transform từ LearningMapUI */
export interface CampData {
  readonly mapId: string;
  readonly name: string;
  readonly state: CampState;
  readonly completionPercent: number;
  readonly totalExercises: number;
  readonly completedExercises: number;
  readonly exercises: ExerciseUI[];
  readonly requirement: string | null;
  readonly subcategory: string | null;
  readonly status: string;
  readonly position: CampPosition;
}

/** Vị trí trại trên đảo (% coordinates) */
export interface CampPosition {
  readonly x: number;
  readonly y: number;
}

/** Data cho boat transition animation */
export interface BoatTransitionData {
  readonly fromIslandName: string;
  readonly toIslandName: string;
  readonly isActive: boolean;
}

// ─── Component Prop Types ─────────────────────────────────────

export interface ArchipelagoMapProps {
  readonly islands: IslandData[];
  readonly onIslandClick: (island: IslandData) => void;
}

export interface IslandNodeProps {
  readonly island: IslandData;
  readonly biomeId: string;
  readonly onClick: (island: IslandData) => void;
}

export interface CampNodeProps {
  readonly camp: CampData;
  readonly biomeColor: string;
  readonly onClick: (camp: CampData) => void;
}



export interface IslandDetailPanelProps {
  readonly island: IslandData;
  readonly biomeId: string;
  readonly onBack: () => void;
  readonly onCampSelect: (camp: CampData) => void;
}

export interface CampExerciseViewProps {
  readonly camp: CampData;
  readonly biomeId: string;
  readonly onBack: () => void;
}

export interface MapOverviewProps {
  readonly islands: IslandData[];
  readonly totalExercises: number;
  readonly completedExercises: number;
}

export interface ProgressRingProps {
  readonly percent: number;
  readonly size: number;
  readonly strokeWidth: number;
  readonly colorClass: string;
  readonly trackClass?: string;
}
