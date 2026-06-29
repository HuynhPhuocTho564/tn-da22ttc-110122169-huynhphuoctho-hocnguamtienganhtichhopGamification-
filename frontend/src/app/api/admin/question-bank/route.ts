import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, CONTENT_STATUSES, readJsonObject, readOptionalString, readRequiredString, readStatus, requireAdminSession } from "@/lib/admin-api";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const soundGroupId = searchParams.get("soundGroupId");
    const questionTypeId = searchParams.get("questionTypeId");

    const where: Record<string, unknown> = {};
    if (soundGroupId) where.soundGroupId = soundGroupId;
    if (questionTypeId) where.questionTypeId = questionTypeId;

    const items = await prisma.questionBankItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        questionType: { select: { id: true, name: true } },
        soundGroup: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error("Admin list question bank items error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const answer = readRequiredString(body, "answer", 1000);
    const questionTypeId = readRequiredString(body, "questionTypeId", 255);
    const prompt = readOptionalString(body, "prompt", 2000);
    const soundGroupId = readOptionalString(body, "soundGroupId", 255);
    const status = readStatus(body.status, CONTENT_STATUSES, "NEEDS_REVIEW");

    if (!answer || !questionTypeId) return apiFailure("VALIDATION_ERROR", "answer và questionTypeId là bắt buộc", 400);
    if (!status) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    // contentJson is required, default to empty object if not provided
    const contentJson = body.contentJson ?? {};

    const item = await prisma.questionBankItem.create({
      data: {
        answer,
        contentJson: contentJson as object,
        questionTypeId,
        prompt: prompt ?? null,
        soundGroupId: soundGroupId ?? null,
        status,
      },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    console.error("Admin create question bank item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
