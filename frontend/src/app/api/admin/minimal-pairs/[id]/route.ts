import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  CONTENT_STATUSES,
  readJsonObject,
  readNullableString,
  readOptionalStatus,
  readRequiredString,
  requireAdminSession,
} from "@/lib/admin-api";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const existing = await prisma.minimalPair.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy minimal pair", 404);

    const note = readNullableString(body, "note", 1000);
    const difficulty = body.difficulty === undefined
      ? undefined
      : typeof body.difficulty === "string" && ["EASY", "MEDIUM", "HARD"].includes(body.difficulty)
        ? body.difficulty
        : null;
    const status = readOptionalStatus(body.status, CONTENT_STATUSES);

    if (note === false) return apiFailure("VALIDATION_ERROR", "note không hợp lệ", 400);
    if (difficulty === null) return apiFailure("VALIDATION_ERROR", "difficulty không hợp lệ", 400);
    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const item = await prisma.minimalPair.update({
      where: { id },
      data: {
        ...(note !== undefined ? { note } : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: {
        soundGroup: { select: { id: true, name: true } },
        wordA: { select: { id: true, word: true, ipa: true } },
        wordB: { select: { id: true, word: true, ipa: true } },
      },
    });

    return apiSuccess({ item });
  } catch (error) {
    console.error("Admin update minimal pair error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.minimalPair.findUnique({
      where: { id },
      include: { _count: { select: { questionBankItems: true } } },
    });

    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy minimal pair", 404);

    if (existing._count.questionBankItems > 0) {
      return apiFailure("IN_USE", "Minimal pair đang được sử dụng trong question bank", 409);
    }

    await prisma.minimalPair.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete minimal pair error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
