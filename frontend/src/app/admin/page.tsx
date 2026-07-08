import AdminDashboardClient, { type AdminDashboardData } from "@/components/admin/AdminDashboardClient";
import type { AdminWordItem } from "@/components/admin/WordItemManagement";
import type { AdminSoundGroup } from "@/components/admin/SoundGroupManagement";
import type { AdminQuestionBankItem } from "@/components/admin/QuestionBankManagement";
import type { AdminMinimalPair } from "@/components/admin/MinimalPairManagement";
import type { AdminSentenceItem } from "@/components/admin/SentenceItemManagement";
import type { AdminBadge } from "@/components/admin/BadgeManagement";
import type { ShopItemCategory, ShopItemStatus } from "@/components/admin/ShopManagement";
import type { LeaderboardTier } from "@/components/admin/LeaderboardManagement";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const DAILY_ACTIVITY_WINDOW_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toDayKey(value: Date) {
  return startOfLocalDay(value).toISOString().slice(0, 10);
}

function formatDayLabel(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(value);
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: { from?: string; to?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "Admin") {
    redirect("/dashboard");
  }

  const todayStart = startOfLocalDay(new Date());
  const defaultFrom = new Date(todayStart.getTime() - 6 * DAY_IN_MS);
  const rangeStart = searchParams?.from ? startOfLocalDay(new Date(searchParams.from)) : defaultFrom;
  const rangeEnd = searchParams?.to ? startOfLocalDay(new Date(searchParams.to + "T23:59:59")) : new Date(todayStart.getTime() + DAY_IN_MS);
  const rangeDays = Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / DAY_IN_MS) + 1);

  const [
    totalUsers,
    activeUsers,
    totalExercises,
    totalQuestions,
    completedAttempts,
    users,
    exercises,
    audioFiles,
    recentAttempts,
    recentUsersForChart,
    newUsersLast7Days,
    topics,
    levels,
    maps,
    questionTypes,
    phonemes,
    wordItems,
    soundGroupsRaw,
    questionBankItems,
    minimalPairs,
    sentenceItems,
    badgesRaw,
    mapProgressUserCounts,
    spinWheelLogsRaw,
    dailyQuestsRaw,
    leaderboardEntriesRaw,
    seasonTransitionsRaw,
    shopItemsRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.exercise.count(),
    prisma.question.count(),
    prisma.exerciseAttempt.count({ where: { status: "COMPLETED" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        createdAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.exercise.findMany({
      orderBy: [{ map: { name: "asc" } }, { name: "asc" }],
      include: {
        topic: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        map: { select: { id: true, name: true } },
        _count: {
          select: {
            questions: {
              where: {
                status: "ACTIVE",
              },
            },
            attempts: true,
          },
        },
      },
    }),
    prisma.audioFile.findMany({
      orderBy: { path: "asc" },
      include: {
        _count: {
          select: {
            exercises: true,
          },
        },
      },
    }),
    prisma.exerciseAttempt.findMany({
      where: {
        createdAt: {
          gte: rangeStart,
        },
      },
      select: {
        score: true,
        createdAt: true,
        exercise: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        createdAt: {
          gte: rangeStart,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: rangeStart,
        },
      },
    }),
    prisma.topic.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            exercises: true,
            soundGroups: true,
          },
        },
      },
    }),
    prisma.level.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            exercises: true,
            soundGroups: true,
          },
        },
      },
    }),
    prisma.learningMap.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        requirement: true,
        status: true,
        subcategory: true,
        unlockThresholdPercent: true,
        requiredMapId: true,
        _count: {
          select: {
            exercises: true,
            progresses: true,
          },
        },
        requiredMap: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.questionType.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.phoneme.findMany({
      orderBy: [{ category: "asc" }, { symbol: "asc" }],
    }),
    prisma.wordItem.findMany({
      orderBy: [{ word: "asc" }],
      include: {
        phoneme: { select: { id: true, symbol: true } },
      },
    }),
    prisma.soundGroup.findMany({
      orderBy: [{ topic: { name: "asc" } }, { name: "asc" }],
      include: {
        topic: { select: { id: true, name: true } },
        _count: { select: { phonemes: true, minimalPairs: true, sentenceItems: true } },
      },
    }),
    prisma.questionBankItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        questionType: { select: { id: true, name: true } },
        soundGroup: { select: { id: true, name: true } },
      },
    }),
    prisma.minimalPair.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        soundGroup: { select: { id: true, name: true } },
        wordA: { select: { id: true, word: true, ipa: true } },
        wordB: { select: { id: true, word: true, ipa: true } },
      },
    }),
    prisma.sentenceItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        soundGroup: { select: { id: true, name: true } },
      },
    }),
    prisma.badge.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { userBadges: true } },
      },
    }),
    prisma.progress.groupBy({
      by: ["mapId"],
      _count: { _all: true },
    }),
    prisma.spinWheelLog.findMany({
      orderBy: { spunAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true } },
      },
    }),
    prisma.dailyQuest.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        user: { select: { username: true } },
      },
    }),
    prisma.leaderboard.findMany({
      orderBy: [{ score: "desc" }],
      take: 200,
      include: {
        user: { select: { username: true, currentTier: true } },
      },
    }),
    prisma.seasonTransitionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true } },
      },
    }),
    prisma.shopItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const completedAttemptsLast7Days = recentAttempts.length;
  const averageScore =
    recentAttempts.length > 0
      ? Math.round(recentAttempts.reduce((total, attempt) => total + attempt.score, 0) / recentAttempts.length)
      : 0;
  const dailyActivity = Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(rangeStart.getTime() + index * DAY_IN_MS);

    return {
      key: toDayKey(date),
      label: formatDayLabel(date),
      newUsers: 0,
      attempts: 0,
    };
  });
  const dailyActivityByKey = new Map(dailyActivity.map((item) => [item.key, item]));

  for (const user of recentUsersForChart) {
    const item = dailyActivityByKey.get(toDayKey(user.createdAt));
    if (item) item.newUsers += 1;
  }

  for (const attempt of recentAttempts) {
    const item = dailyActivityByKey.get(toDayKey(attempt.createdAt));
    if (item) item.attempts += 1;
  }

  const exerciseAttemptSummary = new Map<string, { id: string; name: string; completions: number; totalScore: number }>();
  for (const attempt of recentAttempts) {
    const current = exerciseAttemptSummary.get(attempt.exercise.id) ?? {
      id: attempt.exercise.id,
      name: attempt.exercise.name,
      completions: 0,
      totalScore: 0,
    };
    current.completions += 1;
    current.totalScore += attempt.score;
    exerciseAttemptSummary.set(attempt.exercise.id, current);
  }

  const topExercises = Array.from(exerciseAttemptSummary.values())
    .map((item) => ({
      id: item.id,
      name: item.name,
      completions: item.completions,
      avgScore: Math.round(item.totalScore / item.completions),
    }))
    .sort((first, second) => second.completions - first.completions)
    .slice(0, 5);

  // Maps progress = share of active users that have started each map.
  const mapProgressLookup = new Map(
    mapProgressUserCounts.map((row) => [row.mapId, row._count._all])
  );
  const mapsProgress = maps
    .map((map) => {
      const startedUsers = mapProgressLookup.get(map.id) ?? 0;
      const completionRate = activeUsers > 0
        ? Math.min(100, Math.round((startedUsers / activeUsers) * 100))
        : 0;
      return {
        id: map.id,
        name: map.name,
        status: map.status,
        startedUsers,
        completionRate,
        exerciseCount: map._count.exercises,
        requiredMapId: map.requiredMapId,
        requiredMapName: map.requiredMap?.name ?? null,
        unlockThresholdPercent: map.unlockThresholdPercent,
      };
    })
    .sort((first, second) => second.completionRate - first.completionRate);

  const data: AdminDashboardData = {
    rangeDays,
    stats: {
      totalUsers,
      activeUsers,
      totalExercises,
      totalQuestions,
      completedAttempts,
      newUsersLast7Days,
      completedAttemptsLast7Days,
    },
    spinWheelLogs: spinWheelLogsRaw.map((log) => ({
      id: log.id,
      userId: log.userId,
      username: log.user.username,
      prize: log.prize,
      prizeValue: log.prizeValue,
      spunAt: log.spunAt.toISOString(),
    })),
    dailyQuests: dailyQuestsRaw.map((quest) => ({
      id: quest.id,
      userId: quest.userId,
      username: quest.user.username,
      date: quest.date.toISOString().slice(0, 10),
      questType: quest.questType,
      progress: quest.progress,
      target: quest.target,
      completed: quest.completed,
      claimedAt: quest.claimedAt ? quest.claimedAt.toISOString() : null,
    })),
    leaderboard: leaderboardEntriesRaw.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      username: entry.user.username,
      // currentTier is stored as String in DB; cast to the strict union.
      // TODO: add a runtime validator when migration changes the column to enum.
      tier: entry.user.currentTier as LeaderboardTier,
      score: entry.score,
      correctAnswers: entry.correctAnswers,
      completedExercises: entry.completedExercises,
      type: entry.type as "tuan" | "thang",
      period: entry.period,
      updatedAt: entry.updatedAt.toISOString(),
    })),
    seasonTransitions: seasonTransitionsRaw.map((row) => ({
      id: row.id,
      username: row.user.username,
      period: row.period,
      fromTier: row.fromTier as "bronze" | "silver" | "gold" | "diamond" | "legend",
      toTier: row.toTier as "bronze" | "silver" | "gold" | "diamond" | "legend",
      action: row.action as "promoted" | "demoted" | "stayed",
      rankInTier: row.rankInTier,
      gemsEarned: row.gemsEarned,
      createdAt: row.createdAt.toISOString(),
    })),
    dailyActivity: dailyActivity.map(({ label, newUsers, attempts }) => ({
      label,
      newUsers,
      attempts,
    })),
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role.name,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    })),
    exercises: exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      topicId: exercise.topic.id,
      topic: exercise.topic.name,
      levelId: exercise.level.id,
      level: exercise.level.name,
      mapId: exercise.map.id,
      map: exercise.map.name,
      timeLimit: exercise.timeLimit,
      questionCount: exercise._count.questions,
      attemptCount: exercise._count.attempts,
      status: exercise.status,
    })),
    topics: topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      exerciseCount: topic._count.exercises,
      soundGroupCount: topic._count.soundGroups,
    })),
    levels: levels.map((level) => ({
      id: level.id,
      name: level.name,
      description: level.description,
      exerciseCount: level._count.exercises,
      soundGroupCount: level._count.soundGroups,
    })),
    maps: maps.map((map) => {
      // Derive topicId from exercises belonging to this map
      const mapExercise = exercises.find((e) => e.map.id === map.id);
      const topicId = mapExercise?.topic.id ?? "";
      return {
        id: map.id,
        name: map.name,
        requirement: map.requirement,
        status: map.status,
        exerciseCount: map._count.exercises,
        progressCount: map._count.progresses,
        requiredMapId: map.requiredMapId,
        requiredMapName: map.requiredMap?.name ?? null,
        unlockThresholdPercent: map.unlockThresholdPercent,
        subcategory: map.subcategory,
        topicId,
      };
    }),
    exerciseOptions: {
      topics: topics.map((topic) => ({ id: topic.id, name: topic.name })),
      levels: levels.map((level) => ({ id: level.id, name: level.name })),
      maps: maps.map((map) => ({ id: map.id, name: map.name })),
      questionTypes,
    },
    audioFiles: audioFiles.map((audio) => ({
      id: audio.id,
      path: audio.path,
      duration: audio.duration,
      playLimit: audio.playLimit,
      usedIn: audio._count.exercises,
    })),
    phonemes: phonemes.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      name: p.name,
      category: p.category,
      description: p.description,
      mouthHint: p.mouthHint,
      commonMistake: p.commonMistake,
      status: p.status,
    })),
    wordItems: wordItems.map((w): AdminWordItem => ({
      id: w.id,
      word: w.word,
      ipa: w.ipa,
      difficulty: w.difficulty,
      status: w.status,
      meaningVi: w.meaningVi,
      reviewNote: w.reviewNote,
      phonemeId: w.phonemeId,
      phoneme: w.phoneme ? { id: w.phoneme.id, symbol: w.phoneme.symbol } : undefined,
    })),
    soundGroups: soundGroupsRaw.map((s): AdminSoundGroup => ({
      id: s.id,
      name: s.name,
      description: s.description,
      status: s.status,
      topic: s.topic ? { id: s.topic.id, name: s.topic.name } : null,
      _count: s._count ? { exercises: 0, phonemes: s._count.phonemes } : undefined,
    })),
    questionBankItems: questionBankItems.map((q): AdminQuestionBankItem => ({
      id: q.id,
      answer: q.answer,
      prompt: q.prompt,
      status: q.status,
      questionTypeId: q.questionTypeId,
      soundGroupId: q.soundGroupId,
      questionType: q.questionType ? { id: q.questionType.id, name: q.questionType.name } : undefined,
      soundGroup: q.soundGroup ? { id: q.soundGroup.id, name: q.soundGroup.name } : null,
    })),
    minimalPairs: minimalPairs.map((m): AdminMinimalPair => ({
      id: m.id,
      note: m.note,
      difficulty: m.difficulty,
      status: m.status,
      soundGroup: m.soundGroup ? { id: m.soundGroup.id, name: m.soundGroup.name } : undefined,
      wordA: m.wordA ? { id: m.wordA.id, word: m.wordA.word, ipa: m.wordA.ipa } : undefined,
      wordB: m.wordB ? { id: m.wordB.id, word: m.wordB.word, ipa: m.wordB.ipa } : undefined,
    })),
    sentenceItems: sentenceItems.map((s): AdminSentenceItem => ({
      id: s.id,
      text: s.text,
      difficulty: s.difficulty,
      status: s.status,
      reviewNote: s.reviewNote,
      soundGroup: s.soundGroup ? { id: s.soundGroup.id, name: s.soundGroup.name } : undefined,
    })),
    badges: badgesRaw.map((b): AdminBadge => ({
      id: b.id,
      name: b.name,
      description: b.description,
      image: b.image,
      condition: b.condition,
      type: b.type,
      userCount: b._count.userBadges,
    })),
    shopItems: shopItemsRaw.map((item) => ({
      id: item.id,
      key: item.key,
      name: item.name,
      description: item.description,
      cost: item.cost,
      category: item.category as ShopItemCategory,
      sortOrder: item.sortOrder,
      status: item.status as ShopItemStatus,
    })),
    reports: {
      newUsersLast7Days,
      completedAttemptsLast7Days,
      averageScore,
      topExercises,
    },
    mapsProgress,
  };

  return (
    <AdminDashboardClient
      data={data}
      admin={{
        name: session.user.name ?? "Admin",
        email: session.user.email,
        role: session.user.role ?? "Admin",
      }}
    />
  );
}
