import { NextRequest } from "next/server";
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

    const existing = await prisma.soundGroup.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy sound group", 404);

    const name = body.name === undefined ? undefined : readRequiredString(body, "name", 255);
    const description = readNullableString(body, "description", 1000);
    const status = readOptionalStatus(body.status, CONTENT_STATUSES);

    if (name === null) return apiFailure("VALIDATION_ERROR", "name không hợp lệ", 400);
    if (description === false) return apiFailure("VALIDATION_ERROR", "description không hợp lệ", 400);
    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const item = await prisma.soundGroup.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return apiSuccess({ item });
  } catch (error) {
    console.error("Admin update sound group error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.soundGroup.findUnique({
      where: { id },
      include: { _count: { select: { minimalPairs: true, sentenceItems: true, questionBankItems: true } } },
    });

    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy sound group", 404);
    if (existing._count.minimalPairs > 0 || existing._count.sentenceItems > 0 || existing._count.questionBankItems > 0) return apiFailure("IN_USE", "Sound group đang có dữ liệu liên kết", 409);

    await prisma.soundGroup.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete sound group error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
