import type { LeaderboardPeriodType } from "@/lib/period";
import { getLeaderboardPeriod, startOfLocalDay } from "@/lib/period";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { ExerciseRating } from "@/lib/scoring";
import type { BadgeRarity, BadgeCategory, BadgeStatKey } from "@/lib/gamification/types";
import { MS_PER_DAY } from "@/lib/gamification/constants";

/**
 * Badge Rewards — EXP and gems awarded when earning a badge
 *
 * Based on Octalysis principle: rewards should feel meaningful
 * and proportional to the effort required.
 *
 * Rarity → Reward mapping:
 * - COMMON: 75 EXP, 8 gems (easy to earn, small reward)
 * - RARE: 200 EXP, 28 gems (~2.5x COMMON)
 * - EPIC: 500 EXP, 75 gems (~2.5x RARE)
 * - LEGENDARY: 1250 EXP, 200 gems (~2x EPIC)
 */
export const BADGE_REWARDS: Record<BadgeRarity, { xp: number; gems: number }> = {
  COMMON: { xp: 75, gems: 8 },
  RARE: { xp: 200, gems: 28 },
  EPIC: { xp: 500, gems: 75 },
  LEGENDARY: { xp: 1250, gems: 200 },
  PERIODIC: { xp: 200, gems: 28 }, // Same as RARE (time-limited)
} as const;

export type RewardInput = {
  exerciseScore: number;
  previousBestScore: number | null;
  completedExercisesTodayBefore: number;
  exerciseCompleted: boolean;
};

export type RewardResult = {
  xpEarned: number;
  baseXp: number;
  dailyBonusXp: number;
  retakeXp: number;
  rankingDelta: number;
  dailyBonusRanking: number;
  retakeRanking: number;
  totalRankingDelta: number;
  gemsEarned: number;
};

type PrismaTransactionClient = Prisma.TransactionClient;

export type GamificationDbClient = PrismaClient | PrismaTransactionClient;

export type BadgeAwardReason = "exercise_submit" | "daily_checkin" | "leaderboard_update" | "manual";

export type BadgeAward = {
  id: string;
  name: string;
  rarity: string;
  reward: { xp: number; gems: number };
};

export type BadgeProgress = {
  current: number;
  target: number;
  unit: string;
};

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  condition: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  target: number;
  unit: string;
  statKey: BadgeStatKey;
};

const DAILY_BONUS_TABLE = [
  { completedExercises: 8, xp: 50, ranking: 12, gems: 8 },
  { completedExercises: 5, xp: 35, ranking: 8, gems: 5 },
  { completedExercises: 3, xp: 20, ranking: 4, gems: 3 },
  { completedExercises: 2, xp: 10, ranking: 2, gems: 3 },
];

export const CHECKIN_REWARD = {
  xp: 10,
  rankingScore: 2,
  gems: 3, // Task 4.1: check-in cũng cộng diamonds để mở rộng earning
};

/**
 * BADGE_DEFINITIONS — 27 Achievement Symbols
 *
 * Designed using Yu-kai Chou's Octalysis Framework:
 * - Core Drive 2 (Accomplishment): Milestone + Performance badges
 * - Core Drive 3 (Empowerment): Skill mastery badges
 * - Core Drive 4 (Ownership): Collection + Effort badges
 * - Core Drive 5 (Social Influence): Social badges
 * - Core Drive 6 (Scarcity): Streak tiered badges
 * - Core Drive 7 (Unpredictability): Hidden badges
 * - Core Drive 8 (Loss Aversion): Streak maintenance
 *
 * Design Principles (Yu-kai Chou):
 * - Performance-driven over labor-driven
 * - Quality over quantity (27 meaningful badges)
 * - Tiers over clutter (streak = tiered system)
 * - Story test: each badge has a clear narrative
 * - Share test: users would be proud to show these
 * - Rarity test: LEGENDARY <5%, EPIC <15%, RARE <30%
 */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ═══════════════════════════════════════════════════════════
  // CATEGORY 1: MILESTONE — Accomplishment Drive (CD2)
  // "The journey of a thousand miles begins with a single step"
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-milestone-first-exercise",
    name: "Bước đầu tiên",
    description: "Hoàn thành bài luyện phát âm đầu tiên — mở ra hành trình chinh phục.",
    condition: "Hoàn thành 1 bài tập với điểm từ 70 trở lên.",
    rarity: "COMMON",
    category: "progress",
    target: 1,
    unit: "exercise",
    statKey: "completedExercises",
  },
  {
    id: "badge-milestone-ten-exercises",
    name: "Học viên chăm chỉ",
    description: "Hoàn thành 10 bài luyện tập — bạn đang trên đường đúng.",
    condition: "Hoàn thành 10 bài tập với điểm từ 70 trở lên.",
    rarity: "RARE",
    category: "progress",
    target: 10,
    unit: "exercise",
    statKey: "completedExercises",
  },
  {
    id: "badge-milestone-fifty-exercises",
    name: "Bậc thầy luyện tập",
    description: "Hoàn thành 50 bài luyện tập — sự kiên trì được đền đáp.",
    condition: "Hoàn thành 50 bài tập với điểm từ 70 trở lên.",
    rarity: "EPIC",
    category: "progress",
    target: 50,
    unit: "exercise",
    statKey: "completedExercises",
  },
  {
    id: "badge-milestone-hundred-exercises",
    name: "Huyền thoại 100 bài",
    description: "Hoàn thành 100 bài luyện tập — bạn là huyền thoại.",
    condition: "Hoàn thành 100 bài tập với điểm từ 70 trở lên.",
    rarity: "LEGENDARY",
    category: "progress",
    target: 100,
    unit: "exercise",
    statKey: "completedExercises",
  },
  {
    id: "badge-milestone-perfect-five",
    name: "Năm điểm tuyệt đối",
    description: "Đạt 100 điểm ở 5 bài luyện tập — sự xuất sắc không phải ngẫu nhiên.",
    condition: "Đạt 100 điểm ở 5 bài tập khác nhau.",
    rarity: "EPIC",
    category: "progress",
    target: 5,
    unit: "perfect_exercise",
    statKey: "perfectScoreExercises",
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 2: SKILL — Empowerment Drive (CD3)
  // "Mastery is not a destination, but a continuous journey"
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-skill-ear-training",
    name: "Tai nghe nhạy bén",
    description: "Đạt điểm cao ở các bài nghe chọn đáp án — đôi tai của bạn đang rèn luyện.",
    condition: "Đạt >= 80 điểm ở 3 bài nghe.",
    rarity: "COMMON",
    category: "skill",
    target: 3,
    unit: "listen_exercise",
    statKey: "listeningHighScoreExercises",
  },
  {
    id: "badge-skill-clear-speaker",
    name: "Phát âm rõ ràng",
    description: "Đạt điểm cao ở các bài nói — giọng nói của bạn đang trở nên rõ ràng.",
    condition: "Đạt >= 80 điểm ở 5 bài nói.",
    rarity: "RARE",
    category: "skill",
    target: 5,
    unit: "speaking_exercise",
    statKey: "speakingHighScoreExercises",
  },
  {
    id: "badge-skill-excellent-pronunciation",
    name: "Phát âm xuất sắc",
    description: "Đạt thành tích xuất sắc trong một bài nói — sự hoàn hảo trong từng âm tiết.",
    condition: "Đạt >= 90 điểm ở bất kỳ bài nói nào.",
    rarity: "EPIC",
    category: "skill",
    target: 1,
    unit: "excellent_speaking_exercise",
    statKey: "excellentSpeakingExercises",
  },
  {
    id: "badge-skill-ipa-master",
    name: "Bậc thầy IPA",
    description: "Đạt thành tích xuất sắc ở 10 bài nói — bạn đã làm chủ bảng IPA.",
    condition: "Đạt >= 90 điểm ở 10 bài nói.",
    rarity: "LEGENDARY",
    category: "skill",
    target: 10,
    unit: "excellent_speaking_exercise",
    statKey: "excellentSpeakingExercises",
  },
  {
    id: "badge-skill-difficult-phonemes",
    name: "Chinh phục âm khó",
    description: "Điểm cải thiện rõ rệt ở các bài phát âm phức tạp — thách thức không còn là rào cản.",
    condition: "Cải thiện >= 20 điểm ở các bài phát âm âm khó.",
    rarity: "EPIC",
    category: "skill",
    target: 20,
    unit: "score_delta",
    statKey: "bestImprovement",
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 3: STREAK — Commitment + Scarcity (CD6) + Loss Aversion (CD8)
  // "Consistency is the mother of mastery"
  // Tiered system: Bronze → Silver → Gold → Diamond
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-streak-bronze",
    name: "Khởi động thói quen",
    description: "Duy trì chuỗi học 3 ngày liên tiếp — bước đầu xây dựng thói quen.",
    condition: "Check-in 3 ngày liên tiếp.",
    rarity: "COMMON",
    category: "streak",
    target: 3,
    unit: "day",
    statKey: "streakCount",
  },
  {
    id: "badge-streak-silver",
    name: "Một tuần bền bỉ",
    description: "Duy trì chuỗi học 7 ngày liên tiếp — bạn đã vượt qua giai đoạn khó nhất.",
    condition: "Check-in 7 ngày liên tiếp.",
    rarity: "RARE",
    category: "streak",
    target: 7,
    unit: "day",
    statKey: "streakCount",
  },
  {
    id: "badge-streak-gold",
    name: "Chiến binh 30 ngày",
    description: "Duy trì chuỗi học 30 ngày liên tiếp — sự kiên trì trở thành bản năng.",
    condition: "Check-in 30 ngày liên tiếp.",
    rarity: "EPIC",
    category: "streak",
    target: 30,
    unit: "day",
    statKey: "streakCount",
  },
  {
    id: "badge-streak-diamond",
    name: "Bất diệt 100 ngày",
    description: "Duy trì chuỗi học 100 ngày liên tiếp — bạn là biểu tượng của sự kiên trì.",
    condition: "Check-in 100 ngày liên tiếp.",
    rarity: "LEGENDARY",
    category: "streak",
    target: 100,
    unit: "day",
    statKey: "streakCount",
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 4: PERFORMANCE — Skill + Quality (CD2 + CD3)
  // "Excellence is not a skill, it's an attitude"
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-performance-improvement",
    name: "Tiến bộ rõ rệt",
    description: "Cải thiện điểm bài làm một cách rõ ràng — sự tiến bộ là minh chứng cho nỗ lực.",
    condition: "Làm lại một bài và tăng ít nhất 15 điểm so với kết quả tốt nhất trước đó.",
    rarity: "COMMON",
    category: "improvement",
    target: 15,
    unit: "score_delta",
    statKey: "bestImprovement",
  },
  {
    id: "badge-performance-perfect-scores",
    name: "Điểm tuyệt đối",
    description: "Đạt 100 điểm ở 5 bài luyện tập — sự xuất sắc không phải ngẫu nhiên.",
    condition: "Đạt 100 điểm ở 5 bài tập.",
    rarity: "RARE",
    category: "performance",
    target: 5,
    unit: "perfect_exercise",
    statKey: "perfectScoreExercises",
  },
  {
    id: "badge-performance-weekly-champion",
    name: "Chuyên gia tuần",
    description: "Đạt vị trí số 1 trên bảng xếp hạng tuần — bạn là người xuất sắc nhất tuần này.",
    condition: "Đạt top 1 weekly leaderboard.",
    rarity: "EPIC",
    category: "ranking",
    target: 1,
    unit: "rank",
    statKey: "weeklyRank",
  },
  {
    id: "badge-performance-top3-weekly",
    name: "Top 3 tuần",
    description: "Nằm trong top 3 bảng xếp hạng tuần — bạn thuộc nhóm xuất sắc.",
    condition: "Đạt top 3 weekly leaderboard.",
    rarity: "EPIC",
    category: "ranking",
    target: 3,
    unit: "rank",
    statKey: "weeklyRank",
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 5: EXPLORATION — Discovery + Curiosity (CD7)
  // "The real voyage of discovery consists not in seeking new landscapes,
  //  but in having new eyes" — Marcel Proust
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-explorer-versatile",
    name: "Đa năng",
    description: "Thử nhiều loại câu hỏi khác nhau — sự tò mò dẫn lối.",
    condition: "Hoàn thành bài ở ≥3 loại câu hỏi khác nhau.",
    rarity: "COMMON",
    category: "exploration",
    target: 3,
    unit: "question_type",
    statKey: "uniqueQuestionTypeCount",
  },
  {
    id: "badge-explorer-ipa",
    name: "Nhà thám hiểm IPA",
    description: "Khám phá tất cả các chủ đề IPA trong ứng dụng — bảng phonetics không còn bí ẩn.",
    condition: "Hoàn thành ít nhất 1 bài ở mỗi topic IPA (4 topics).",
    rarity: "RARE",
    category: "exploration",
    target: 4,
    unit: "topic",
    statKey: "uniqueTopicCount",
  },
  {
    id: "badge-explorer-master",
    name: "Bậc thám hiểm",
    description: "Khám phá và làm chủ tất cả các chủ đề IPA — bạn đã chinh phục bảng phonetics.",
    condition: "Hoàn thành bài ở ≥8 chủ đề IPA khác nhau.",
    rarity: "EPIC",
    category: "exploration",
    target: 8,
    unit: "topic",
    statKey: "uniqueTopicCount",
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 6: EFFORT — Resilience + Ownership (CD4)
  // "Fall seven times, stand up eight" — Japanese Proverb
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-effort-persistent",
    name: "Không bỏ cuộc",
    description: "Kiên trì thử lại bài tập nhiều lần — thất bại là stepping stone.",
    condition: "Thử lại 1 bài ≥3 lần.",
    rarity: "COMMON",
    category: "effort",
    target: 3,
    unit: "retake",
    statKey: "maxRetakeCount",
  },
  {
    id: "badge-effort-grit",
    name: "Kiên trì vượt khó",
    description: "Thử lại bài tập 10 lần không nản lòng — bạn có tố chất của người thành công.",
    condition: "Thử lại 1 bài ≥10 lần.",
    rarity: "RARE",
    category: "effort",
    target: 10,
    unit: "retake",
    statKey: "maxRetakeCount",
  },
  {
    id: "badge-effort-phoenix",
    name: "Phượng hoàng",
    description: "Từ yếu kém vươn lên xuất sắc — biểu tượng của Growth Mindset.",
    condition: "Từ <50 điểm → ≥80 điểm trên cùng 1 bài.",
    rarity: "EPIC",
    category: "effort",
    target: 30,
    unit: "score_delta",
    statKey: "bestComebackScore",
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 7: SOCIAL — Social Influence (CD5)
  // "Alone we can do so little; together we can do so much"
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-social-sharer",
    name: "Người chia sẻ",
    description: "Chia sẻ thành tích học tập với bạn bè — truyền cảm hứng cho người khác.",
    condition: "Chia sẻ thành tích ≥3 lần.",
    rarity: "COMMON",
    category: "social",
    target: 3,
    unit: "share",
    statKey: "shareCount",
  },
  {
    id: "badge-social-inspirer",
    name: "Người truyền cảm hứng",
    description: "Chia sẻ thành tích 10 lần — bạn là nguồn cảm hứng cho cộng đồng.",
    condition: "Chia sẻ thành tích ≥10 lần.",
    rarity: "RARE",
    category: "social",
    target: 10,
    unit: "share",
    statKey: "shareCount",
  },

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 8: HIDDEN — Unpredictability (CD7) + Surprise
  // "The best things in life are unexpected"
  // ═══════════════════════════════════════════════════════════
  {
    id: "badge-hidden-mystery",
    name: "Bí ẩn",
    description: "Bạn đã tìm thấy huy hiệu bí ẩn — sự tò mò được đền đáp.",
    condition: "Cơ hội 5% ngẫu nhiên sau khi hoàn thành bài tập.",
    rarity: "EPIC",
    category: "exploration",
    target: 1,
    unit: "hidden",
    statKey: "uniqueTopicCount",
  },
];

export function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

export function getNextLevelXp(level: number) {
  return Math.max(1, level) ** 2 * 100;
}

function getDailyBonus(completedExercisesAfter: number, exerciseScore: number) {
  if (exerciseScore < 50) {
    return { xp: 0, ranking: 0, gems: 0 };
  }

  const matched = DAILY_BONUS_TABLE.find((item) => completedExercisesAfter >= item.completedExercises);
  return matched ? { xp: matched.xp, ranking: matched.ranking, gems: matched.gems } : { xp: 0, ranking: 0, gems: 0 };
}

export function calculateExerciseRewards(input: RewardInput): RewardResult {
  const previousBestScore = input.previousBestScore ?? null;
  const isFirstAttempt = previousBestScore === null;
  const improved = previousBestScore !== null && input.exerciseScore > previousBestScore;
  const completedExercisesAfter = input.completedExercisesTodayBefore + (input.exerciseCompleted ? 1 : 0);
  const dailyBonus = input.exerciseCompleted
    ? getDailyBonus(completedExercisesAfter, input.exerciseScore)
    : { xp: 0, ranking: 0, gems: 0 };

  const nominalXp = Math.round(input.exerciseScore);
  let baseXp = 0;
  let retakeXp = 0;
  let rankingDelta = 0;
  let retakeRanking = 0;

  if (isFirstAttempt) {
    baseXp = Math.round(nominalXp * 1.5); // ×1.5 for first attempt
    rankingDelta = input.exerciseScore;
  } else if (improved && previousBestScore !== null) {
    const improvement = input.exerciseScore - previousBestScore;
    baseXp = Math.round(improvement * 2); // chênh lệch × 2
    rankingDelta = improvement;
  } else if (input.exerciseScore >= 50) {
    retakeXp = Math.max(1, Math.round(nominalXp * 0.2)); // ×0.2 (tăng từ 0.1)
    retakeRanking = Math.min(5, Math.max(1, Math.round(input.exerciseScore * 0.05)));
  }

  const xpEarned = baseXp + retakeXp + dailyBonus.xp;
  const totalRankingDelta = rankingDelta + retakeRanking + dailyBonus.ranking;
  const gemsEarned = dailyBonus.gems; // gems chỉ từ daily bonus, exercise gems tính riêng

  return {
    xpEarned,
    baseXp,
    dailyBonusXp: dailyBonus.xp,
    retakeXp,
    rankingDelta,
    dailyBonusRanking: dailyBonus.ranking,
    retakeRanking,
    totalRankingDelta,
    gemsEarned,
  };
}

export function getLeaderboardTargets(date = new Date()): Array<{
  type: LeaderboardPeriodType;
  period: string;
}> {
  return [
    { type: "tuan", period: getLeaderboardPeriod("tuan", date) },
  ];
}

export function getBadgeDefinition(id: string) {
  return BADGE_DEFINITIONS.find((definition) => definition.id === id) ?? null;
}

export async function ensureBadge(db: GamificationDbClient, definition: BadgeDefinition) {
  return db.badge.upsert({
    where: { id: definition.id },
    create: {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      condition: definition.condition,
      type: definition.rarity,
    },
    update: {
      name: definition.name,
      description: definition.description,
      condition: definition.condition,
      type: definition.rarity,
    },
  });
}

async function awardBadge(
  db: GamificationDbClient,
  userId: string,
  definition: BadgeDefinition,
  validPeriod?: string | null,
): Promise<BadgeAward | null> {
  const badge = await ensureBadge(db, definition);

  const existing = await db.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId,
        badgeId: badge.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return null;
  }

  // Award badge
  await db.userBadge.create({
    data: {
      userId,
      badgeId: badge.id,
      validPeriod: validPeriod ?? null,
    },
  });

  // Award EXP and gems based on rarity
  const reward = BADGE_REWARDS[definition.rarity] ?? BADGE_REWARDS.COMMON;
  await db.user.update({
    where: { id: userId },
    data: {
      xp: { increment: reward.xp },
      gems: { increment: reward.gems },
    },
  });

  return {
    id: badge.id,
    name: badge.name,
    rarity: badge.type,
    reward,
  };
}

/** Known question type IDs for speaking exercises (maintainable-code: Type Safety E) */
const SPEAKING_TYPE_KEYWORDS = new Set(["voice", "speak", "noi", "minimal"]);

/** Known question type IDs for listening exercises */
const LISTENING_TYPE_KEYWORDS = new Set(["listen", "nghe", "mc", "multiple"]);

function isSpeakingQuestionType(typeId: string, typeName: string) {
  const normalized = `${typeId} ${typeName}`.toLowerCase();
  for (const keyword of SPEAKING_TYPE_KEYWORDS) {
    if (normalized.includes(keyword)) return true;
  }
  return false;
}

function isListeningQuestionType(typeId: string, typeName: string) {
  const normalized = `${typeId} ${typeName}`.toLowerCase();
  for (const keyword of LISTENING_TYPE_KEYWORDS) {
    if (normalized.includes(keyword)) return true;
  }
  return false;
}

export function getBadgeProgressFromStats(
  definition: BadgeDefinition,
  stats: Record<BadgeStatKey, number>,
): BadgeProgress | null {
  const current = stats[definition.statKey];
  if (current === undefined) return null;
  return {
    current,
    target: definition.target,
    unit: definition.unit,
  };
}

export async function getUserBadgeStats(db: GamificationDbClient, userId: string, date = new Date()) {
  const weeklyPeriod = getLeaderboardPeriod("tuan", date);

  const [user, attempts, weeklyLeaderboard] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        streakCount: true,
      },
    }),
    db.exerciseAttempt.findMany({
      where: {
        userId,
      },
      select: {
        score: true,
        exerciseId: true,
        exercise: {
          select: {
            questions: {
              select: {
                type: {
              select: {
                id: true,
                name: true,
              },
            },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    db.leaderboard.findMany({
      where: {
        type: "tuan",
        period: weeklyPeriod,
      },
      select: {
        userId: true,
        score: true,
      },
      orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
      take: 50,
    }),
  ]);

  const bestByExercise = new Map<
    string,
    {
      score: number;
      hasListening: boolean;
      hasSpeaking: boolean;
    }
  >();

  let bestImprovement = 0;

  for (const attempt of attempts) {
    const questionTypes = attempt.exercise.questions.map((question) => question.type);
    const hasListening = questionTypes.some((type) => isListeningQuestionType(type.id, type.name));
    const hasSpeaking = questionTypes.some((type) => isSpeakingQuestionType(type.id, type.name));
    const previous = bestByExercise.get(attempt.exerciseId);

    if (previous) {
      bestImprovement = Math.max(bestImprovement, attempt.score - previous.score);
      if (attempt.score > previous.score) {
        bestByExercise.set(attempt.exerciseId, {
          score: attempt.score,
          hasListening: previous.hasListening || hasListening,
          hasSpeaking: previous.hasSpeaking || hasSpeaking,
        });
      }
    } else {
      bestByExercise.set(attempt.exerciseId, {
        score: attempt.score,
        hasListening,
        hasSpeaking,
      });
    }
  }

  const bestAttempts = Array.from(bestByExercise.values());
  const completedExercises = bestAttempts.filter((attempt) => attempt.score >= 60).length;
  const listeningHighScoreExercises = bestAttempts.filter(
    (attempt) => attempt.hasListening && attempt.score >= 80,
  ).length;
  const speakingHighScoreExercises = bestAttempts.filter(
    (attempt) => attempt.hasSpeaking && attempt.score >= 80,
  ).length;
  const excellentSpeakingExercises = bestAttempts.filter(
    (attempt) => attempt.hasSpeaking && attempt.score >= 90,
  ).length;
  const weeklyRankIndex = weeklyLeaderboard.findIndex((item) => item.userId === userId);
  const weeklyRank = weeklyRankIndex >= 0 ? weeklyRankIndex + 1 : 0;

  /** Numeric badge stats — compatible with Record<BadgeStatKey, number>. */
  const badgeStats: Record<BadgeStatKey, number> = {
    completedExercises,
    listeningHighScoreExercises,
    speakingHighScoreExercises,
    excellentSpeakingExercises,
    streakCount: user?.streakCount ?? 0,
    bestImprovement: Math.max(0, bestImprovement),
    weeklyRank,
    uniqueTopicCount: 0,
    uniqueQuestionTypeCount: 0,
    shareCount: 0,
    maxRetakeCount: 0,
    bestComebackScore: 0,
    perfectScoreExercises: bestAttempts.filter((a) => a.score >= 100).length,
  };

  return {
    ...badgeStats,
    weeklyPeriod,
  };
}

export async function checkAndAwardBadges(
  db: GamificationDbClient,
  userId: string,
  reason: BadgeAwardReason = "manual",
  date = new Date(),
): Promise<BadgeAward[]> {
  const stats = await getUserBadgeStats(db, userId, date);
  const awarded: BadgeAward[] = [];

  for (const definition of BADGE_DEFINITIONS) {
    if (reason === "daily_checkin" && definition.category !== "streak") {
      continue;
    }

    const progress = getBadgeProgressFromStats(definition, stats);
    if (!progress) {
      continue;
    }

    const isRankingBadge = definition.category === "ranking";
    const achieved = isRankingBadge
      ? stats.weeklyRank > 0 && stats.weeklyRank <= definition.target
      : progress.current >= progress.target;

    if (!achieved) {
      continue;
    }

    const badge = await awardBadge(
      db,
      userId,
      definition,
      definition.rarity === "PERIODIC" ? stats.weeklyPeriod : null,
    );

    if (badge) {
      awarded.push(badge);
    }
  }

  return awarded;
}

// === SP7: Diamond + Shop + Streak Freeze ===

/**
 * Diamond earning table (Task 4.1) — mở rộng nguồn diamonds để economy có ý nghĩa.
 * Trước: chỉ EXCELLENT exercise earn 5 diamonds → quá chậm.
 * Sau: GOOD exercise + check-in + streak milestone đều earn diamonds.
 */
export const GEM_REWARDS = {
  excellent_exercise: 10, // Score >= 90
  good_exercise: 5, // Score >= 80
  pass_exercise: 2, // Score >= 70
  daily_checkin: 3, // Check-in mỗi ngày
  streak_7_bonus: 15, // Streak 7 ngày
  streak_14_bonus: 30, // Streak 14 ngày
  daily_quest_complete: 10, // Quest hoàn thành
  weekly_challenge: 25, // Weekly challenge
} as const;

export function computeGemReward(rating: ExerciseRating): number {
  if (rating === "EXCELLENT") return GEM_REWARDS.excellent_exercise;
  if (rating === "GOOD") return GEM_REWARDS.good_exercise;
  if (rating === "PASS") return GEM_REWARDS.pass_exercise;
  return 0;
}

/**
 * Tính diamond bonus cho streak milestone (Task 4.1).
 * Trả 0 nếu chưa đạt milestone, trả diamonds nếu vừa đạt mốc 7 hoặc 14.
 * @param newStreak — streak sau khi check-in
 * @param previousStreak — streak trước đó (để biết "vừa đạt" hay "đã đạt từ trước")
 */
export function computeStreakMilestoneGems(newStreak: number, previousStreak: number): number {
  if (newStreak === 7 && previousStreak < 7) return GEM_REWARDS.streak_7_bonus;
  if (newStreak === 14 && previousStreak < 14) return GEM_REWARDS.streak_14_bonus;
  return 0;
}

export function validateShopPurchase(
  userGems: number,
  itemCost: number,
): { ok: true } | { ok: false; reason: "NOT_ENOUGH_GEMS" } {
  if (userGems < itemCost) return { ok: false, reason: "NOT_ENOUGH_GEMS" };
  return { ok: true };
}

// Task 4.2: Shop categories + mở rộng từ 3 → 10 items
export type ShopCategory = "power_up" | "cosmetic" | "protection";

export type ShopItem = {
  id: string;
  name: string;
  cost: number;
  category: ShopCategory;
  desc: string;
  icon: string;
};

export const SHOP_ITEMS: readonly ShopItem[] = [
  // Power-ups (hỗ trợ luyện tập)
  { id: "slow_audio", name: "Loa Ma Thuật", cost: 20, category: "power_up", desc: "Nghe audio chậm x0.5 trong 1 bài", icon: "🔊" },
  { id: "xp_boost", name: "Sách Thần", cost: 40, category: "power_up", desc: "x1.5 EXP trong 3 bài tiếp theo", icon: "📖" },
  { id: "hint_token", name: "Gợi Ý Vàng", cost: 15, category: "power_up", desc: "Loại 1 đáp án sai trong bài nghe", icon: "💡" },

  // Protection (bảo vệ streak/safety)
  { id: "streak_freeze", name: "Bùa Đóng Băng", cost: 10, category: "protection", desc: "Giữ chuỗi ngày khi lỡ 1 ngày", icon: "❄️" },
  { id: "second_chance", name: "Cơ Hội Thứ Hai", cost: 30, category: "protection", desc: "Được làm lại 1 câu sai trong bài", icon: "🔄" },

  // Cosmetic (avatar/profile)
  { id: "frame_silver", name: "Viền Avatar Bạc", cost: 40, category: "cosmetic", desc: "Khung bạc cơ bản cho avatar", icon: "🖼️" },
  { id: "frame_gold", name: "Khung Avatar Vàng", cost: 80, category: "cosmetic", desc: "Khung viền vàng cho avatar", icon: "🖼️" },
  { id: "frame_diamond", name: "Viền Avatar Kim Cương", cost: 150, category: "cosmetic", desc: "Khung lấp lánh cao cấp cho avatar", icon: "💎" },
  { id: "frame_fire", name: "Khung Avatar Lửa", cost: 100, category: "cosmetic", desc: "Khung viền lửa cho avatar", icon: "🔥" },
] as const;

export function calculateNextStreak(
  lastCheckInDate: Date | null,
  currentStreak: number,
  today: Date,
  streakFreezes: number = 0,
): { alreadyCheckedIn: boolean; streak: number; usedFreeze: boolean } {
  if (!lastCheckInDate) {
    return { alreadyCheckedIn: false, streak: 1, usedFreeze: false };
  }
  const lastDay = startOfLocalDay(lastCheckInDate);
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / MS_PER_DAY);
  if (diffDays === 0) {
    return { alreadyCheckedIn: true, streak: currentStreak, usedFreeze: false };
  }
  if (diffDays === 1) {
    return { alreadyCheckedIn: false, streak: currentStreak + 1, usedFreeze: false };
  }
  if (streakFreezes > 0) {
    return { alreadyCheckedIn: false, streak: currentStreak, usedFreeze: true };
  }
  return { alreadyCheckedIn: false, streak: 1, usedFreeze: false };
}

// === SP7: Daily Quests ===

/** Quest type definitions - pool of daily quests available for rotation */
export const QUEST_TYPES = [
  { type: "PRACTICE_3", target: 3, desc: "Luyện 3 bài hôm nay", rewardXp: 50, rewardGems: 10 },
  { type: "CD2_3", target: 3, desc: "Hoàn thành 3 bài CĐ2 Phụ âm", rewardXp: 50, rewardGems: 10 },
  { type: "CD4_LINKING_3", target: 3, desc: "Hoàn thành 3 bài CĐ4 nối âm (g03)", rewardXp: 50, rewardGems: 10 },
] as const;

export type QuestType = (typeof QUEST_TYPES)[number]["type"];

/**
 * Fisher-Yates shuffle — unbiased random permutation.
 * Thay vì `sort(() => Math.random() - 0.5)` (biased), dùng thuật toán chuẩn.
 * @see maintainable-code: KISS + Pure function
 */
function fisherYatesShuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Randomly pick 3 quests from the pool for a daily rotation */
export function pickDailyQuests(): {
  type: string;
  target: number;
  desc: string;
  rewardXp: number;
  rewardGems: number;
}[] {
  const shuffled = fisherYatesShuffle(QUEST_TYPES);
  return shuffled.slice(0, 3).map((q) => ({
    type: q.type,
    target: q.target,
    desc: q.desc,
    rewardXp: q.rewardXp,
    rewardGems: q.rewardGems,
  }));
}

/**
 * Check if an exercise submit should increment a quest's progress.
 * Returns true if the quest type conditions are met.
 */
export function shouldIncrementQuest(
  questType: string,
  payload: { exerciseCompleted: boolean; topicId: string; soundGroupId: string },
): boolean {
  if (questType === "PRACTICE_3") return payload.exerciseCompleted;
  if (questType === "CD2_3") return payload.exerciseCompleted && payload.topicId === "topic-2-consonants";
  if (questType === "CD4_LINKING_3") return payload.exerciseCompleted && payload.soundGroupId === "map-t4-g03-linking";
  return false;
}

// === SP4: Scoring multiplier + Retake limit ===

/** Maximum retakes allowed per exercise per day before EXP is capped */
export const MAX_RETAKE_PER_DAY = 5;

/**
 * Compute EXP multiplier based on exercise question types.
 * Speaking exercises earn full EXP; listening exercises earn 80%.
 */
export function computeXpMultiplier(questionTypeIds: string[]): number {
  if (questionTypeIds.length === 0) return 1;
  const speakingCount = questionTypeIds.filter(
    (id) => id.includes("voice") || id.includes("minimal-pairs"),
  ).length;
  const ratio = speakingCount / questionTypeIds.length;
  // If majority speaking: 1.0, if majority listening: 0.8, else 0.9
  if (ratio >= 0.5) return 1.0;
  return 0.8;
}

/**
 * Check if user has exceeded the daily retake limit for a specific exercise.
 * Returns true if the user should receive reduced EXP (retake limit hit).
 */
export function isRetakeLimitExceeded(attemptCountToday: number): boolean {
  return attemptCountToday >= MAX_RETAKE_PER_DAY;
}
