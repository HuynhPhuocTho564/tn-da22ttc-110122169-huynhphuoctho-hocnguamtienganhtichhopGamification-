import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  QUESTION_STATUSES,
  apiFailure,
  apiSuccess,
  isRecord,
  readJsonObject,
  readOptionalInt,
  readOptionalStatus,
  readOptionalString,
  readRequiredString,
  refreshExerciseQuestionCount,
  requireAdminSession,
} from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ questionId: string }>;
};

type ParsedOption = {
  id?: string;
  content: string;
};

function serializeQuestion(question: {
  id: string;
  name: string | null;
  content: string;
  status: string;
  score: number;
  answer: string;
  exerciseId: string;
  type: { id: string; name: string };
  options: Array<{ id: string; content: string }>;
}) {
  return {
    id: question.id,
    exerciseId: question.exerciseId,
    name: question.name,
    content: question.content,
    status: question.status,
    score: question.score,
    answer: question.answer,
    type: question.type,
    options: question.options,
  };
}

function readContentUpdate(body: Record<string, unknown>) {
  if (body.content === undefined && body.contentJson === undefined) {
    return undefined;
  }

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

function readOptionsUpdate(body: Record<string, unknown>): ParsedOption[] | null | undefined {
  if (body.options === undefined) {
    return undefined;
  }

  if (body.options === null) {
    return [];
  }

  if (!Array.isArray(body.options)) {
    return null;
  }

  const options: ParsedOption[] = [];
  const seen = new Set<string>();

  for (const option of body.options) {
    if (typeof option === "string") {
      const content = option.trim();
      if (!content || content.length > 255 || seen.has(content.toLowerCase())) return null;
      seen.add(content.toLowerCase());
      options.push({ content });
      continue;
    }

    if (!isRecord(option) || typeof option.content !== "string") {
      return null;
    }

    const content = option.content.trim();
    const id = typeof option.id === "string" && option.id.trim() ? option.id.trim() : undefined;
    if (!content || content.length > 255 || seen.has(content.toLowerCase())) return null;

    seen.add(content.toLowerCase());
    options.push({ id, content });
  }

  if (options.length === 1 || options.length > 8) {
    return null;
  }

  return options;
}

async function getQuestion(questionId: string) {
  return prisma.question.findUnique({
    where: { id: questionId },
    include: {
      type: { select: { id: true, name: true } },
      options: { select: { id: true, content: true } },
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { questionId } = await context.params;
    const question = await getQuestion(questionId);
    if (!question) {
      return apiFailure("QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi", 404);
    }

    return apiSuccess({ question: serializeQuestion(question) });
  } catch (error) {
    console.error("Admin get question error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy câu hỏi", 500);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { questionId } = await context.params;
    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        exerciseId: true,
        answer: true,
      },
    });

    if (!existing) {
      return apiFailure("QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi", 404);
    }

    const name = body.name === undefined ? undefined : readOptionalString(body, "name", 255);
    const content = readContentUpdate(body);
    const answer = body.answer === undefined ? undefined : readRequiredString(body, "answer", 1000);
    const score = readOptionalInt(body, "score", 1, 100);
    const status = readOptionalStatus(body.status, QUESTION_STATUSES);
    const typeId = body.typeId === undefined ? undefined : readRequiredString(body, "typeId", 100);
    const options = readOptionsUpdate(body);

    if (name === null || content === null || answer === null || score === null || status === null || typeId === null || options === null) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu cập nhật câu hỏi không hợp lệ", 400);
    }

    if (typeId) {
      const questionType = await prisma.questionType.findUnique({ where: { id: typeId }, select: { id: true } });
      if (!questionType) {
        return apiFailure("QUESTION_TYPE_NOT_FOUND", "Loại câu hỏi không tồn tại", 404);
      }
    }

    const effectiveAnswer = answer ?? existing.answer;
    if (options && options.length > 0 && !options.some((option) => option.content.trim().toLowerCase() === effectiveAnswer.trim().toLowerCase())) {
      return apiFailure("VALIDATION_ERROR", "Danh sách lựa chọn phải có một đáp án trùng với answer", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      if (options !== undefined) {
        await tx.answerOption.deleteMany({ where: { questionId } });

        if (options.length > 0) {
          await tx.answerOption.createMany({
            data: options.map((option) => ({
              id: option.id,
              questionId,
              content: option.content,
            })),
          });
        }
      }

      const question = await tx.question.update({
        where: { id: questionId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(content !== undefined ? { content } : {}),
          ...(answer !== undefined ? { answer } : {}),
          ...(score !== undefined ? { score } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(typeId !== undefined ? { typeId } : {}),
        },
        include: {
          type: { select: { id: true, name: true } },
          options: { select: { id: true, content: true } },
        },
      });

      const questionCount = await refreshExerciseQuestionCount(tx, existing.exerciseId);

      return {
        question,
        questionCount,
      };
    });

    return apiSuccess({
      question: serializeQuestion(result.question),
      questionCount: result.questionCount,
    });
  } catch (error) {
    console.error("Admin update question error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi cập nhật câu hỏi", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { questionId } = await context.params;
    const existing = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        exerciseId: true,
      },
    });

    if (!existing) {
      return apiFailure("QUESTION_NOT_FOUND", "Không tìm thấy câu hỏi", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const question = await tx.question.update({
        where: { id: questionId },
        data: {
          status: "ARCHIVED",
        },
        include: {
          type: { select: { id: true, name: true } },
          options: { select: { id: true, content: true } },
        },
      });

      const questionCount = await refreshExerciseQuestionCount(tx, existing.exerciseId);

      return {
        question,
        questionCount,
      };
    });

    return apiSuccess({
      question: serializeQuestion(result.question),
      questionCount: result.questionCount,
    });
  } catch (error) {
    console.error("Admin archive question error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lưu trữ câu hỏi", 500);
  }
}
