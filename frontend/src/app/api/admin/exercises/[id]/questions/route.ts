import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  QUESTION_STATUSES,
  apiFailure,
  apiSuccess,
  isRecord,
  readJsonObject,
  readOptionalInt,
  readOptionalString,
  readRequiredString,
  readStatus,
  refreshExerciseQuestionCount,
  requireAdminSession,
} from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ParsedOption = {
  content: string;
};

function serializeQuestion(question: {
  id: string;
  name: string | null;
  content: string;
  status: string;
  score: number;
  answer: string;
  type: { id: string; name: string };
  options: Array<{ id: string; content: string }>;
}) {
  return {
    id: question.id,
    name: question.name,
    content: question.content,
    status: question.status,
    score: question.score,
    answer: question.answer,
    type: question.type,
    options: question.options,
  };
}

function readContent(body: Record<string, unknown>) {
  if (typeof body.content === "string") {
    const content = body.content.trim();
    return content.length > 0 && content.length <= 5000 ? content : null;
  }

  if (body.contentJson !== undefined) {
    try {
      return JSON.stringify(body.contentJson);
    } catch {
      return null;
    }
  }

  return null;
}

function readOptions(body: Record<string, unknown>): ParsedOption[] | null | undefined {
  if (body.options === undefined || body.options === null) {
    return undefined;
  }

  if (!Array.isArray(body.options)) {
    return null;
  }

  const options: ParsedOption[] = [];
  const seen = new Set<string>();

  for (const option of body.options) {
    const content = typeof option === "string" ? option.trim() : isRecord(option) && typeof option.content === "string" ? option.content.trim() : "";

    if (!content || content.length > 255 || seen.has(content.toLowerCase())) {
      return null;
    }

    seen.add(content.toLowerCase());
    options.push({ content });
  }

  if (options.length > 0 && options.length < 2) {
    return null;
  }

  if (options.length > 8) {
    return null;
  }

  return options;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exercise) {
      return apiFailure("EXERCISE_NOT_FOUND", "Không tìm thấy bài tập", 404);
    }

    const questions = await prisma.question.findMany({
      where: { exerciseId: id },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: {
        type: { select: { id: true, name: true } },
        options: { select: { id: true, content: true } },
      },
    });

    return apiSuccess({ questions: questions.map(serializeQuestion) });
  } catch (error) {
    console.error("Admin list questions error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy câu hỏi", 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const exercise = await prisma.exercise.findUnique({ where: { id }, select: { id: true } });
    if (!exercise) {
      return apiFailure("EXERCISE_NOT_FOUND", "Không tìm thấy bài tập", 404);
    }

    const typeId = readRequiredString(body, "typeId", 100);
    const name = readOptionalString(body, "name", 255);
    const content = readContent(body);
    const answer = readRequiredString(body, "answer", 1000);
    const parsedScore = readOptionalInt(body, "score", 1, 100);
    const score = parsedScore ?? 10;
    const status = readStatus(body.status, QUESTION_STATUSES, "DRAFT");
    const options = readOptions(body);

    if (!typeId || name === null || !content || !answer || parsedScore === null || !status || options === null) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu câu hỏi không hợp lệ", 400);
    }

    const questionType = await prisma.questionType.findUnique({
      where: { id: typeId },
      select: { id: true, name: true },
    });

    if (!questionType) {
      return apiFailure("QUESTION_TYPE_NOT_FOUND", "Loại câu hỏi không tồn tại", 404);
    }

    if (options && options.length > 0 && !options.some((option) => option.content.trim().toLowerCase() === answer.trim().toLowerCase())) {
      return apiFailure("VALIDATION_ERROR", "Danh sách lựa chọn phải có một đáp án trùng với answer", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          name,
          content,
          answer,
          score,
          status,
          typeId,
          exerciseId: id,
          options: options && options.length > 0 ? { create: options } : undefined,
        },
        include: {
          type: { select: { id: true, name: true } },
          options: { select: { id: true, content: true } },
        },
      });

      const questionCount = await refreshExerciseQuestionCount(tx, id);

      return {
        question,
        questionCount,
      };
    });

    return apiSuccess(
      {
        question: serializeQuestion(result.question),
        questionCount: result.questionCount,
      },
      201,
    );
  } catch (error) {
    console.error("Admin create question error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo câu hỏi", 500);
  }
}
