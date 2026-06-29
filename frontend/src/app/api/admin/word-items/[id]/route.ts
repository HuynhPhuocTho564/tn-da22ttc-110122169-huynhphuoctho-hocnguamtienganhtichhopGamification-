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

    const existing = await prisma.wordItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy word item", 404);

    const word = body.word === undefined ? undefined : readRequiredString(body, "word", 255);
    const ipa = body.ipa === undefined ? undefined : readRequiredString(body, "ipa", 255);
    const meaningVi = readNullableString(body, "meaningVi", 1000);
    const reviewNote = readNullableString(body, "reviewNote", 2000);
    const status = readOptionalStatus(body.status, CONTENT_STATUSES);

    if (word === null || ipa === null) return apiFailure("VALIDATION_ERROR", "Dữ liệu không hợp lệ", 400);
    if (meaningVi === false || reviewNote === false) return apiFailure("VALIDATION_ERROR", "Text không hợp lệ", 400);
    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const item = await prisma.wordItem.update({
      where: { id },
      data: {
        ...(word !== undefined ? { word } : {}),
        ...(ipa !== undefined ? { ipa } : {}),
        ...(meaningVi !== undefined ? { meaningVi } : {}),
        ...(reviewNote !== undefined ? { reviewNote } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return apiSuccess({ item });
  } catch (error) {
    console.error("Admin update word item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.wordItem.findUnique({
      where: { id },
      include: { _count: { select: { minimalPairAsWordA: true, minimalPairAsWordB: true, questionBankItems: true } } },
    });

    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy word item", 404);

    if (existing._count.minimalPairAsWordA > 0 || existing._count.minimalPairAsWordB > 0 || existing._count.questionBankItems > 0) {
      return apiFailure("IN_USE", "Word item đang được sử dụng", 409);
    }

    await prisma.wordItem.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete word item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
