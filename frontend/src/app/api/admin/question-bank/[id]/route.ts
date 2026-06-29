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

    const existing = await prisma.questionBankItem.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy question bank item", 404);

    const answer = body.answer === undefined ? undefined : readRequiredString(body, "answer", 1000);
    const prompt = readNullableString(body, "prompt", 2000);
    const status = readOptionalStatus(body.status, CONTENT_STATUSES);

    if (answer === null) return apiFailure("VALIDATION_ERROR", "answer không hợp lệ", 400);
    if (prompt === false) return apiFailure("VALIDATION_ERROR", "prompt không hợp lệ", 400);
    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const item = await prisma.questionBankItem.update({
      where: { id },
      data: {
        ...(answer !== undefined ? { answer } : {}),
        ...(prompt !== undefined ? { prompt } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(body.contentJson !== undefined ? { contentJson: body.contentJson as object } : {}),
      },
    });

    return apiSuccess({ item });
  } catch (error) {
    console.error("Admin update question bank item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.questionBankItem.findUnique({ where: { id }, select: { id: true } });

    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy question bank item", 404);

    await prisma.questionBankItem.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete question bank item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
