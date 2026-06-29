import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, CONTENT_STATUSES, readJsonObject, readOptionalString, readRequiredString, readStatus, requireAdminSession } from "@/lib/admin-api";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const soundGroupId = searchParams.get("soundGroupId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (soundGroupId) where.soundGroupId = soundGroupId;
    if (status) where.status = status;

    const items = await prisma.sentenceItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        soundGroup: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error("Admin list sentence items error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const text = readRequiredString(body, "text", 2000);
    const soundGroupId = readRequiredString(body, "soundGroupId", 255);
    const reviewNote = readOptionalString(body, "reviewNote", 2000);
    const difficulty = typeof body.difficulty === "string" ? body.difficulty : "EASY";
    const status = readStatus(body.status, CONTENT_STATUSES, "NEEDS_REVIEW");

    if (!text || !soundGroupId) return apiFailure("VALIDATION_ERROR", "text và soundGroupId là bắt buộc", 400);
    if (!status) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    // targetWords is optional JSON array
    const rawTargetWords = Array.isArray(body.targetWords) ? body.targetWords : null;

    const item = await prisma.sentenceItem.create({
      data: {
        text,
        soundGroupId,
        targetWords: rawTargetWords ?? Prisma.JsonNull,
        reviewNote: reviewNote ?? null,
        difficulty,
        status,
      },
      include: {
        soundGroup: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    console.error("Admin create sentence item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
