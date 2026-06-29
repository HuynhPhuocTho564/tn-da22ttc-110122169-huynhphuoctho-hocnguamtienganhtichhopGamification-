import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiSuccess, apiFailure } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import {
  calculateExerciseRewards,
  calculateLevelFromXp,
  checkAndAwardBadges,
  calculateNextStreak,
  computeGemReward,
  computeXpMultiplier,
  getLeaderboardTargets,
  getNextLevelXp,
  isRetakeLimitExceeded,
  shouldIncrementQuest,
} from "@/lib/gamification";
import { updateWeeklyChallengeProgress } from "@/lib/gamification/weekly-challenge-service";
import { XP_BOOST_MULTIPLIER } from "@/lib/gamification/constants";
import { formatLocalDate, startOfLocalDay } from "@/lib/period";
import {
  calculateExerciseScore,
  getExerciseRating,
  isExerciseCompleted,
  scoreQuestion,
  type SubmitAnswerInput,
} from "@/lib/scoring";

type SubmitPayload = {
  exerciseId?: string;
  startedAt?: string;
  completedAt?: string;
  answers?: SubmitAnswerInput[];
};

function isValidAnswer(answer: unknown): answer is SubmitAnswerInput {
  if (!answer || typeof answer !== "object") return false;
  const candidate = answer as SubmitAnswerInput;
  return typeof candidate.questionId === "string" && candidate.questionId.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SubmitPayload;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return apiFailure("UNAUTHENTICATED", "Cần đăng nhập để nộp bài", 401);
    }

    if (!payload.exerciseId || typeof payload.exerciseId !== "string") {
      return apiFailure("VALIDATION_ERROR", "exerciseId không hợp lệ", 400);
    }

    if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
      return apiFailure("EMPTY_ANSWERS", "Chưa có câu trả lời để nộp", 400);
    }

    if (!payload.answers.every(isValidAnswer)) {
      return apiFailure("VALIDATION_ERROR", "answers không hợp lệ", 400);
    }

    const exercise = await prisma.exercise.findUnique({
      where: {
        id: payload.exerciseId,
        status: "ACTIVE",
      },
      include: {
        questions: {
          where: {
            status: "ACTIVE",
          },
          include: {
            type: true,
            options: true,
          },
        },
      },
    });

    if (!exercise) {
      return apiFailure("EXERCISE_NOT_FOUND", "Không tìm thấy bài tập", 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xp: true,
        level: true,
        gems: true,
        streakCount: true,
        longestStreak: true,
        lastCheckInDate: true,
        totalCheckIns: true,
        streakFreezes: true,
        xpBoostRemaining: true,
      },
    });

    if (!user) {
      return apiFailure("UNAUTHENTICATED", "Không tìm thấy user", 401);
    }

    const questionById = new Map(exercise.questions.map((question) => [question.id, question]));
    const answers = payload.answers;

    for (const answer of answers) {
      if (!questionById.has(answer.questionId)) {
        return apiFailure("QUESTION_NOT_IN_EXERCISE", "Một câu hỏi không thuộc bài tập này", 400);
      }
    }

    const uniqueQuestionIds = new Set(answers.map((answer) => answer.questionId));
    if (uniqueQuestionIds.size !== answers.length) {
      return apiFailure("VALIDATION_ERROR", "Một câu hỏi bị nộp lặp lại", 400);
    }

    const questionResults = answers.map((answer) => {
      const question = questionById.get(answer.questionId);
      if (!question) {
        throw new Error(`Question missing after validation: ${answer.questionId}`);
      }

      // v2 Mode B: map acceptedAnswers (Prisma JsonValue → string[] | null) cho scoreVoice multi-match
      const scoringQuestion = {
        id: question.id,
        answer: question.answer,
        score: question.score,
        type: question.type,
        acceptedAnswers: Array.isArray(question.acceptedAnswers)
          ? (question.acceptedAnswers as string[])
          : null,
        options: question.options,
      };

      return scoreQuestion(scoringQuestion, answer);
    });

    const scoreSummary = calculateExerciseScore(questionResults);
    const exerciseCompleted = isExerciseCompleted(scoreSummary.exerciseScore);
    const rating = getExerciseRating(scoreSummary.exerciseScore);
    const gemReward = computeGemReward(rating);
    const today = startOfLocalDay(new Date());

    // EXP multiplier based on question types (speaking vs listening)
    const questionTypeIds = exercise.questions.map((q) => q.type.id);
    const xpMultiplier = computeXpMultiplier(questionTypeIds);

    const [previousBestAttempt, dailyActivityBefore, dailyAttempts] = await Promise.all([
      prisma.exerciseAttempt.findFirst({
        where: {
          userId,
          exerciseId: exercise.id,
        },
        orderBy: {
          score: "desc",
        },
        select: {
          score: true,
        },
      }),
      prisma.dailyActivity.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        select: {
          completedExercises: true,
        },
      }),
      // Count today's attempts for this exercise (retake limit check)
      prisma.exerciseAttempt.count({
        where: {
          userId,
          exerciseId: exercise.id,
          createdAt: { gte: today },
        },
      }),
    ]);

    const retakeLimitReached = isRetakeLimitExceeded(dailyAttempts);

    const rewards = calculateExerciseRewards({
      exerciseScore: scoreSummary.exerciseScore,
      previousBestScore: previousBestAttempt?.score ?? null,
      completedExercisesTodayBefore: dailyActivityBefore?.completedExercises ?? 0,
      exerciseCompleted,
    });

    // Apply EXP multiplier: type multiplier × boost (if active) × retake limit
    const hasXpBoost = user.xpBoostRemaining > 0;
    const boostMultiplier = hasXpBoost ? XP_BOOST_MULTIPLIER : 1.0;
    const adjustedXpEarned = retakeLimitReached
      ? Math.round(rewards.xpEarned * 0.1) // 90% reduction after limit
      : Math.round(rewards.xpEarned * xpMultiplier * boostMultiplier);

    const completedAt = payload.completedAt ? new Date(payload.completedAt) : new Date();
    const totalTimeSpent = answers.reduce((total, answer) => total + Math.max(0, answer.timeSpent ?? 0), 0);

    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.exerciseAttempt.create({
        data: {
          name: `${exercise.name} - ${completedAt.toISOString()}`,
          status: exerciseCompleted ? "COMPLETED" : "NEEDS_PRACTICE",
          attemptCount: previousBestAttempt ? 2 : 1,
          score: scoreSummary.exerciseScore,
          userId,
          exerciseId: exercise.id,
          questionAttempts: {
            create: questionResults.map((questionResult) => ({
              questionId: questionResult.questionId,
              transcript: questionResult.transcript,
              selectedOptionId: questionResult.selectedOptionId,
              isCorrect: questionResult.isCorrect,
              score: questionResult.score,
              accuracyScore: questionResult.accuracyScore,
              feedback: questionResult.feedback,
              audioUrl: questionResult.audioUrl,
              timeSpent: questionResult.timeSpent,
            })),
          },
        },
      });

      const updatedUserXp = user.xp + adjustedXpEarned;
      const updatedUserLevel = Math.max(user.level, calculateLevelFromXp(updatedUserXp));

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: adjustedXpEarned },
          level: updatedUserLevel,
          ...(gemReward > 0 ? { gems: { increment: gemReward } } : {}),
          ...(hasXpBoost ? { xpBoostRemaining: { decrement: 1 } } : {}),
        },
        select: {
          xp: true,
          level: true,
          gems: true,
          xpBoostRemaining: true,
        },
      });

      const dailyActivity = await tx.dailyActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        create: {
          userId,
          date: today,
          xpEarned: adjustedXpEarned,
          completedExercises: exerciseCompleted ? 1 : 0,
        },
        update: {
          xpEarned: { increment: adjustedXpEarned },
          completedExercises: exerciseCompleted ? { increment: 1 } : undefined,
        },
      });

      for (const target of getLeaderboardTargets(completedAt)) {
        await tx.leaderboard.upsert({
          where: {
            userId_type_period: {
              userId,
              type: target.type,
              period: target.period,
            },
          },
          create: {
            userId,
            type: target.type,
            period: target.period,
            score: rewards.totalRankingDelta,
            correctAnswers: scoreSummary.correctAnswers,
            completedExercises: exerciseCompleted ? 1 : 0,
          },
          update: {
            score: { increment: rewards.totalRankingDelta },
            correctAnswers: { increment: scoreSummary.correctAnswers },
            completedExercises: exerciseCompleted ? { increment: 1 } : undefined,
          },
        });
      }

      const badgesAwarded = await checkAndAwardBadges(tx, userId, "exercise_submit", completedAt);

      // Quest progress: check active quests and increment if conditions met
      const questPayload = {
        exerciseCompleted: exerciseCompleted,
        topicId: exercise.topicId,
        soundGroupId: exercise.mapId,
      };
      const activeQuests = await tx.dailyQuest.findMany({
        where: { userId, date: today, completed: false },
      });
      let questGemDelta = 0;
      let questXpDelta = 0;
      const questUpdates: Array<{
        id: string;
        questType: string;
        progress: number;
        target: number;
        completed: boolean;
        rewardXp: number;
        rewardGems: number;
      }> = [];

      for (const quest of activeQuests) {
        if (shouldIncrementQuest(quest.questType, questPayload)) {
          const newProgress = quest.progress + 1;
          const isQuestComplete = newProgress >= quest.target;
          if (isQuestComplete) {
            questGemDelta += quest.rewardGems;
            questXpDelta += quest.rewardXp;
          }
          await tx.dailyQuest.update({
            where: { id: quest.id },
            data: {
              progress: newProgress,
              completed: isQuestComplete,
              claimedAt: isQuestComplete ? completedAt : undefined,
            },
          });
          questUpdates.push({
            id: quest.id,
            questType: quest.questType,
            progress: newProgress,
            target: quest.target,
            completed: isQuestComplete,
            rewardXp: quest.rewardXp,
            rewardGems: quest.rewardGems,
          });
        }
      }

      // Apply quest EXP/diamond rewards to user if any quests completed
      if (questGemDelta > 0 || questXpDelta > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(questXpDelta > 0 ? { xp: { increment: questXpDelta } } : {}),
            ...(questGemDelta > 0 ? { gems: { increment: questGemDelta } } : {}),
          },
        });
      }

      // Auto check-in: update streak when user submits an exercise
      const streakStatus = calculateNextStreak(user.lastCheckInDate, user.streakCount, today, user.streakFreezes);
      let streakResult = {
        streakCount: user.streakCount,
        longestStreak: user.longestStreak,
        totalCheckIns: user.totalCheckIns,
        autoCheckedIn: false,
      };
      if (!streakStatus.alreadyCheckedIn) {
        const checkedInUser = await tx.user.update({
          where: { id: userId },
          data: {
            lastCheckInDate: completedAt,
            streakCount: streakStatus.streak,
            longestStreak: Math.max(streakStatus.streak, user.longestStreak),
            totalCheckIns: { increment: 1 },
            ...(streakStatus.usedFreeze ? { streakFreezes: { decrement: 1 } } : {}),
          },
          select: {
            streakCount: true,
            longestStreak: true,
            totalCheckIns: true,
          },
        });
        streakResult = {
          streakCount: checkedInUser.streakCount,
          longestStreak: checkedInUser.longestStreak,
          totalCheckIns: checkedInUser.totalCheckIns,
          autoCheckedIn: true,
        };
      }

      // Weekly challenge progress: update based on metric type
      const weeklyXpTotal = updatedUser.xp; // Total EXP after this exercise
      await updateWeeklyChallengeProgress(
        tx,
        userId,
        { score: scoreSummary.exerciseScore },
        {
          currentStreak: streakResult.streakCount,
          weeklyXpEarned: weeklyXpTotal,
        },
      );

      return {
        attempt,
        updatedUser,
        dailyActivity,
        badgesAwarded,
        questUpdates,
        questGemDelta,
        questXpDelta,
        streakResult,
      };
    });

    return apiSuccess(
      {
        exerciseAttemptId: result.attempt.id,
        exerciseScore: scoreSummary.exerciseScore,
        maxScore: 100,
        isCompleted: exerciseCompleted,
        rating,
        summary: {
          totalQuestions: exercise.questions.length,
          answeredQuestions: answers.length,
          correctAnswers: scoreSummary.correctAnswers,
          rawScore: scoreSummary.rawScore,
          maxRawScore: scoreSummary.maxScore,
          timeSpent: totalTimeSpent,
        },
        rewards: {
          xpEarned: rewards.baseXp,
          dailyBonusXp: rewards.dailyBonusXp,
          retakeXp: rewards.retakeXp,
          totalXpEarned: adjustedXpEarned,
          xpMultiplier: xpMultiplier,
          xpBoostActive: hasXpBoost,
          xpBoostRemaining: result.updatedUser.xpBoostRemaining,
          retakeLimitReached: retakeLimitReached,
          gemsEarned: gemReward,
          questXpEarned: result.questXpDelta,
          questGemsEarned: result.questGemDelta,
          rankingDelta: rewards.rankingDelta,
          dailyBonusRanking: rewards.dailyBonusRanking,
          retakeRanking: rewards.retakeRanking,
          totalRankingDelta: rewards.totalRankingDelta,
        },
        progress: {
          currentXp: result.updatedUser.xp,
          level: result.updatedUser.level,
          nextLevelXp: getNextLevelXp(result.updatedUser.level),
        },
        dailyActivity: {
          date: formatLocalDate(today),
          completedExercises: result.dailyActivity.completedExercises,
          xpEarned: result.dailyActivity.xpEarned,
        },
        badgesAwarded: result.badgesAwarded,
        previousBestScore: previousBestAttempt?.score ?? null,
        streak: {
          count: result.streakResult.streakCount,
          longest: result.streakResult.longestStreak,
          totalCheckIns: result.streakResult.totalCheckIns,
          autoCheckedIn: result.streakResult.autoCheckedIn,
        },
        questionResults: questionResults.map((questionResult) => ({
          questionId: questionResult.questionId,
          isCorrect: questionResult.isCorrect,
          score: questionResult.score,
          accuracyScore: questionResult.accuracyScore,
          feedback: questionResult.feedback,
        })),
        questUpdates: result.questUpdates,
      },
      201,
    );
  } catch (error) {
    console.error("Submit exercise error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi nộp bài", 500);
  }
}
