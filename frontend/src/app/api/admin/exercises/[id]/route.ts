import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  EXERCISE_STATUSES,
  apiFailure,
  apiSuccess,
  readJsonObject,
  readNullableString,
  readOptionalStatus,
  readRequiredString,
  readStatus,
  requireAdminSession,
} from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeExerciseDetail(exercise: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  timeLimit: number | null;
  questionCount: number;
  topic: { id: string; name: string };
  level: { id: string; name: string };
  map: { id: string; name: string };
  questions: Array<{
    id: string;
    name: string | null;
    content: string;
    status: string;
    score: number;
    answer: string;
    type: { id: string; name: string };
    options: Array<{ id: string; content: string }>;
  }>;
  _count: { attempts: number };
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
    attemptCount: exercise._count.attempts,
    questions: exercise.questions.map((question) => ({
      id: question.id,
      name: question.name,
      content: question.content,
      status: question.status,
      score: question.score,
      answer: question.answer,
      type: question.type,
      options: question.options,
    })),
  };
}

async function getExerciseDetail(id: string) {
  return prisma.exercise.findUnique({
    where: { id },
    include: {
      topic: { select: { id: true, name: true } },
      level: { select: { id: true, name: true } },
      map: { select: { id: true, name: true } },
      questions: {
        orderBy: [{ name: "asc" }, { id: "asc" }],
        include: {
          type: { select: { id: true, name: true } },
          options: { select: { id: true, content: true } },
        },
      },
      _count: { select: { attempts: true } },
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const exercise = await getExerciseDetail(id);
    if (!exercise) {
      return apiFailure("EXERCISE_NOT_FOUND", "Không tìm thấy bài tập", 404);
    }

    return apiSuccess({ exercise: serializeExerciseDetail(exercise) });
  } catch (error) {
    console.error("Admin get exercise error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy chi tiết bài tập", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const existing = await prisma.exercise.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return apiFailure("EXERCISE_NOT_FOUND", "Không tìm thấy bài tập", 404);
    }

    const name = body.name === undefined ? undefined : readRequiredString(body, "name", 255);
    const description = readNullableString(body, "description", 1000);
    const topicId = body.topicId === undefined ? undefined : readRequiredString(body, "topicId", 100);
    const levelId = body.levelId === undefined ? undefined : readRequiredString(body, "levelId", 100);
    const mapId = body.mapId === undefined ? undefined : readRequiredString(body, "mapId", 100);
    const status = readOptionalStatus(body.status, EXERCISE_STATUSES);

    if (
      name === null ||
      description === false ||
      topicId === null ||
      levelId === null ||
      mapId === null ||
      status === null
    ) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu cập nhật bài tập không hợp lệ", 400);
    }

    const referenceChecks = await Promise.all([
      topicId ? prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } }) : Promise.resolve({ id: "" }),
      levelId ? prisma.level.findUnique({ where: { id: levelId }, select: { id: true } }) : Promise.resolve({ id: "" }),
      mapId ? prisma.learningMap.findUnique({ where: { id: mapId }, select: { id: true } }) : Promise.resolve({ id: "" }),
    ]);

    if (referenceChecks.some((item) => !item)) {
      return apiFailure("REFERENCE_NOT_FOUND", "Topic, level hoặc learning map không tồn tại", 404);
    }

    await prisma.exercise.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(topicId !== undefined ? { topicId } : {}),
        ...(levelId !== undefined ? { levelId } : {}),
        ...(mapId !== undefined ? { mapId } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    const exercise = await getExerciseDetail(id);
    if (!exercise) {
      return apiFailure("EXERCISE_NOT_FOUND", "Không tìm thấy bài tập sau khi cập nhật", 404);
    }

    return apiSuccess({ exercise: serializeExerciseDetail(exercise) });
  } catch (error) {
    console.error("Admin update exercise error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi cập nhật bài tập", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.exercise.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!existing) {
      return apiFailure("EXERCISE_NOT_FOUND", "Không tìm thấy bài tập", 404);
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        status: "ARCHIVED",
      },
      include: {
        topic: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        map: { select: { id: true, name: true } },
        questions: {
          orderBy: [{ name: "asc" }, { id: "asc" }],
          include: {
            type: { select: { id: true, name: true } },
            options: { select: { id: true, content: true } },
          },
        },
        _count: { select: { attempts: true } },
      },
    });

    return apiSuccess({ exercise: serializeExerciseDetail(exercise) });
  } catch (error) {
    console.error("Admin archive exercise error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lưu trữ bài tập", 500);
  }
}
