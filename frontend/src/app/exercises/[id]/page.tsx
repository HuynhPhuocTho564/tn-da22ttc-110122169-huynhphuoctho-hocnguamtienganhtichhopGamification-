import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExerciseEngineClient from "./ExerciseEngineClient";

export const dynamic = "force-dynamic";

type JsonOption = {
  id?: unknown;
  text?: unknown;
  content?: unknown;
};

function isJsonOption(value: unknown): value is JsonOption {
  return Boolean(value) && typeof value === "object";
}

function getQuestionOptions(question: {
  id: string;
  content: string;
  options: Array<{ id: string; content: string }>;
}) {
  if (question.options.length > 0) {
    return question.options.map((option) => ({
      id: option.id,
      content: option.content,
    }));
  }

  try {
    const parsed = JSON.parse(question.content) as { options?: unknown };
    if (Array.isArray(parsed.options)) {
      return parsed.options
        .filter(isJsonOption)
        .map((option, index) => ({
          id: String(option.id ?? `${question.id}-opt-${index}`),
          content: String(option.text ?? option.content ?? ""),
        }))
        .filter((option) => option.content.length > 0);
    }
  } catch {
    // Plain text question content has no embedded options.
  }

  return [];
}

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [exercise, userUnlocks] = await Promise.all([
    prisma.exercise.findUnique({
      where: {
        id,
        status: "ACTIVE",
      },
      include: {
        questions: {
          where: {
            status: "ACTIVE",
          },
          include: {
            options: true,
            type: true,
          },
        },
      },
    }),
    // Fetch unlock flags + level for logged-in users (shop items + reward events)
    (async () => {
      if (!session?.user?.id) return { unlockedSlowAudio: false, unlockedIpaReveal: false, userLevel: 0, hintTokens: 0, secondChances: 0 };
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { unlockedSlowAudio: true, unlockedIpaReveal: true, level: true, hintTokens: true, secondChances: true },
      });
      return {
        unlockedSlowAudio: user?.unlockedSlowAudio ?? false,
        unlockedIpaReveal: user?.unlockedIpaReveal ?? false,
        userLevel: user?.level ?? 0,
        hintTokens: user?.hintTokens ?? 0,
        secondChances: user?.secondChances ?? 0,
      };
    })(),
  ]);

  if (!exercise) {
    notFound();
  }

  // SP6: Route-level gating — block access to locked topics
  if (userUnlocks.userLevel > 0) {
    const exerciseTopic = await prisma.topic.findUnique({
      where: { id: exercise.topicId },
      select: { orderIndex: true, unlockThresholdPercent: true },
    });

    if (exerciseTopic && exerciseTopic.unlockThresholdPercent > 0) {
      // Find prerequisite topic (orderIndex - 1)
      const prereq = await prisma.topic.findFirst({
        where: { orderIndex: exerciseTopic.orderIndex - 1 },
        include: { exercises: { where: { status: "ACTIVE" }, select: { id: true } } },
      });

      if (prereq && prereq.exercises.length > 0) {
        if (session?.user?.id) {
          const bestAttempts = await prisma.exerciseAttempt.groupBy({
            by: ["exerciseId"],
            where: { userId: session.user.id },
            _max: { score: true },
          });
          const scoreMap = new Map(bestAttempts.map((a) => [a.exerciseId, a._max.score ?? 0]));
          const completed = prereq.exercises.filter((e) => (scoreMap.get(e.id) ?? 0) >= 60).length;
          const percent = Math.round((completed / prereq.exercises.length) * 100);

          if (percent < exerciseTopic.unlockThresholdPercent) {
            redirect(`/learning_map?locked=${exercise.topicId}&percent=${percent}&required=${exerciseTopic.unlockThresholdPercent}`);
          }
        }
      }
    }
  }

  const exerciseData = {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    questions: exercise.questions.map((question) => ({
      id: question.id,
      name: question.name,
      content: question.content,
      type: question.type.id,
      answer: question.answer,
      acceptedAnswers: Array.isArray(question.acceptedAnswers)
        ? (question.acceptedAnswers as string[])
        : null,
      score: question.score,
      options: getQuestionOptions(question),
    })),
  };

  return <ExerciseEngineClient exercise={exerciseData} unlocks={userUnlocks} />;
}
