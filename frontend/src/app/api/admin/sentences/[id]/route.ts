import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, CONTENT_STATUSES, readJsonObject, readNullableString, readOptionalStatus, readRequiredString, requireAdminSession } from "@/lib/admin-api";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const existing = await prisma.sentenceItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy sentence item", 404);

    const text = body.text === undefined ? undefined : readRequiredString(body, "text", 2000);
    const reviewNote = readNullableString(body, "reviewNote", 2000);
    const difficulty = body.difficulty === undefined
      ? undefined
      : typeof body.difficulty === "string" && ["EASY", "MEDIUM", "HARD"].includes(body.difficulty)
        ? body.difficulty
        : null;
    const status = readOptionalStatus(body.status, CONTENT_STATUSES);

    if (text === null) return apiFailure("VALIDATION_ERROR", "text không hợp lệ", 400);
    if (reviewNote === false) return apiFailure("VALIDATION_ERROR", "reviewNote không hợp lệ", 400);
    if (difficulty === null) return apiFailure("VALIDATION_ERROR", "difficulty không hợp lệ", 400);
    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    // Handle targetWords update
    const targetWordsUpdate = body.targetWords === undefined
      ? {}
      : Array.isArray(body.targetWords)
        ? { targetWords: body.targetWords as Prisma.InputJsonValue }
        : body.targetWords === null
          ? { targetWords: Prisma.JsonNull }
          : {};

    const item = await prisma.sentenceItem.update({
      where: { id },
      data: {
        ...(text !== undefined ? { text } : {}),
        ...(reviewNote !== undefined ? { reviewNote } : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        ...(status !== undefined ? { status } : {}),
        ...targetWordsUpdate,
      },
      include: {
        soundGroup: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ item });
  } catch (error) {
    console.error("Admin update sentence item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.sentenceItem.findUnique({
      where: { id },
      include: { _count: { select: { questionBankItems: true } } },
    });

    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy sentence item", 404);

    if (existing._count.questionBankItems > 0) {
      return apiFailure("IN_USE", "Sentence item đang được sử dụng trong question bank", 409);
    }

    await prisma.sentenceItem.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete sentence item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
