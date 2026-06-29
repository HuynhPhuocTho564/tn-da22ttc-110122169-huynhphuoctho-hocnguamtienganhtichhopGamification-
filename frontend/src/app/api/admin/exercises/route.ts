import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EXERCISE_STATUSES,
  apiFailure,
  apiSuccess,
  readJsonObject,
  readOptionalString,
  readRequiredString,
  readStatus,
  requireAdminSession,
} from "@/lib/admin-api";

function serializeExercise(exercise: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  timeLimit: number | null;
  questionCount: number;
  topic: { id: string; name: string };
  level: { id: string; name: string };
  map: { id: string; name: string };
  _count: { questions: number; attempts: number };
}) {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    status: exercise.status,
    timeLimit: exercise.timeLimit,
    questionCount: exercise.questionCount,
    topic: exercise.topic,
    level: exercise.level,
    map: exercise.map,
    totalQuestions: exercise._count.questions,
    attemptCount: exercise._count.attempts,
  };
}

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const exercises = await prisma.exercise.findMany({
      orderBy: [{ map: { name: "asc" } }, { name: "asc" }],
      include: {
        topic: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        map: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return apiSuccess({ exercises: exercises.map(serializeExercise) });
  } catch (error) {
    console.error("Admin list exercises error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy danh sách bài tập", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const name = readRequiredString(body, "name", 255);
    const description = readOptionalString(body, "description", 1000);
    const topicId = readRequiredString(body, "topicId", 100);
    const levelId = readRequiredString(body, "levelId", 100);
    const mapId = readRequiredString(body, "mapId", 100);
    const status = readStatus(body.status, EXERCISE_STATUSES, "DRAFT");

    if (!name || description === null || !topicId || !levelId || !mapId || !status) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu bài tập không hợp lệ", 400);
    }

    const [topic, level, map] = await Promise.all([
      prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } }),
      prisma.level.findUnique({ where: { id: levelId }, select: { id: true } }),
      prisma.learningMap.findUnique({ where: { id: mapId }, select: { id: true } }),
    ]);

    if (!topic || !level || !map) {
      return apiFailure("REFERENCE_NOT_FOUND", "Topic, level hoặc learning map không tồn tại", 404, {
        topicExists: Boolean(topic),
        levelExists: Boolean(level),
        mapExists: Boolean(map),
      });
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        description,
        topicId,
        levelId,
        mapId,
        status,
      },
      include: {
        topic: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        map: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return apiSuccess({ exercise: serializeExercise(exercise) }, 201);
  } catch (error) {
    console.error("Admin create exercise error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo bài tập", 500);
  }
}
