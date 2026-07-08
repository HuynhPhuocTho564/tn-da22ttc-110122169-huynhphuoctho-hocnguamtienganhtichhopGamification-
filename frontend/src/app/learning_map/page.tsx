import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TOPICS } from "../../../prisma/lesson-catalog";
import { type LearningMapUI, type TopicUI } from "./types/island";
import IslandMapView from "./components/IslandMapView";
import { ISLAND_BIOMES } from "./constants/islands";

export const dynamic = "force-dynamic";

export default async function LearningMapPage() {
  const session = await auth();

  const [topicsDB, bestAttempts] = await Promise.all([
    prisma.topic.findMany({
      orderBy: {
        id: "asc", // Sort by ID to get topic-1, topic-2, topic-3, topic-4 order
      },
      include: {
        exercises: {
          orderBy: {
            name: "asc",
          },
          include: {
            map: {
              select: {
                id: true,
                name: true,
                requirement: true,
                status: true,
                subcategory: true,
              },
            },
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
    }),
    session?.user?.id
      ? prisma.exerciseAttempt.groupBy({
          by: ["exerciseId"],
          where: {
            userId: session.user.id,
          },
          _max: {
            score: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const bestScoreByExerciseId = new Map(
    bestAttempts.map((attempt) => [attempt.exerciseId, attempt._max.score ?? null]),
  );

  const topics: TopicUI[] = topicsDB.map((topic) => {
    const mapsById = new Map<string, LearningMapUI>();

    for (const exercise of topic.exercises) {
      const existingMap = mapsById.get(exercise.map.id);

      if (!existingMap) {
        mapsById.set(exercise.map.id, {
          id: exercise.map.id,
          name: exercise.map.name,
          requirement: exercise.map.requirement,
          status: exercise.map.status,
          subcategory: exercise.map.subcategory,
          exercises: [],
        });
      }

      const bestScore = bestScoreByExerciseId.get(exercise.id) ?? null;

      mapsById.get(exercise.map.id)!.exercises.push({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        status: exercise.status,
        questionCount: exercise._count.questions,
        bestScore,
        isCompleted: bestScore !== null && bestScore >= 60,
      });
    }

    const maps = Array.from(mapsById.values()).sort((first, second) => {
      // Sort by map ID which follows pattern: map-t1-g01-..., map-t1-g02-..., etc.
      // This ensures sound groups are sorted by their orderIndex
      return first.id.localeCompare(second.id);
    });

    for (const map of maps) {
      map.exercises.sort((first, second) => {
        // Sort by exercise mode order: listen_choose (1), speak_word (2), speak_minimal_pair (3), speak_sentence (4)
        const getModeOrder = (id: string) => {
          if (id.includes("listen_choose")) return 1;
          if (id.includes("speak_word")) return 2;
          if (id.includes("speak_minimal_pair")) return 3;
          if (id.includes("speak_sentence")) return 4;
          return 5;
        };
        return getModeOrder(first.id) - getModeOrder(second.id);
      });
    }

    return {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      maps,
    };
  });

  // Merge stress + linking topics into ONE island "Trọng âm & Nối âm"
  // Also filter out topic-4-stress-connected (empty) since merged topic replaces it
  const STRESS_LINKING_IDS = ["topic-4-stress-connected", "topic-5-stress", "topic-6-linking"];
  const stressTopics = topics.filter((t) => STRESS_LINKING_IDS.includes(t.id));
  const otherTopics = topics.filter((t) => !STRESS_LINKING_IDS.includes(t.id));

  if (stressTopics.length > 0) {
    const mergedMaps = stressTopics.flatMap((t) => t.maps);
    mergedMaps.sort((a, b) => a.id.localeCompare(b.id));
    otherTopics.push({
      id: "topic-4-stress-connected",
      name: "Trọng âm & Nối âm",
      description: "4 nhóm đặc thù: Word Stress, Weak Forms, Linking, Assimilation",
      maps: mergedMaps,
    });
  }

  // Re-sort by original orderIndex (1=nguyên âm, 2=phụ âm, 3=minimal pairs, 4=stress+linking)
  const ORDER = ["topic-1-vowels", "topic-2-consonants", "topic-3-minimal-pairs-hard", "topic-4-stress-connected"];
  otherTopics.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  // Calculate lock status based on prerequisite topic completion (100% rule: count-based, không dùng %)
  const topicById = new Map(otherTopics.map((t) => [t.id, t]));
  for (const topicUI of otherTopics) {
    const topicDef = TOPICS.find((t) => t.id === topicUI.id);
    if (topicDef && topicDef.unlockThresholdPercent > 0) {
      // Find prerequisite topic (the one with orderIndex - 1)
      const prereqDef = TOPICS.find((t) => t.orderIndex === topicDef.orderIndex - 1);
      if (prereqDef) {
        const prereqUI = topicById.get(prereqDef.id);
        if (prereqUI) {
          const prereqStats = prereqUI.maps.reduce(
            (acc, map) => {
              acc.total += map.exercises.length;
              acc.completed += map.exercises.filter((e) => e.isCompleted).length;
              return acc;
            },
            { total: 0, completed: 0 },
          );
          const percent = prereqStats.total > 0 ? Math.round((prereqStats.completed / prereqStats.total) * 100) : 0;
          // Mastery Island Rule: count số bài đạt 3 sao (bestScore >= 90) trên prereq island
          const countBestScore90Plus = prereqUI.maps.reduce(
            (acc, map) =>
              acc + map.exercises.filter((e) => (e.bestScore ?? 0) >= 90).length,
            0,
          );
          const totalExercises = prereqStats.total;
          // 100% rule: phải hoàn thành TẤT CẢ trại (count-based, không dùng %).
          // Nếu prereq không có exercise → unlocked (total = 0 → unlocked, không có yêu cầu).
          topicUI.isLocked = totalExercises > 0 && prereqStats.completed < totalExercises;
          topicUI.completionPercent = percent;
          topicUI.prerequisiteName = ISLAND_BIOMES[`topic-${prereqDef.orderIndex}`]?.name ?? prereqDef.name;
          // Mastery fields cho ProgressRing (Chunk 3 — IslandNode):
          topicUI.totalExercises = totalExercises;
          topicUI.countBestScore90Plus = countBestScore90Plus;
        }
      }
    }
  }

  return <IslandMapView topics={otherTopics} />;
}
