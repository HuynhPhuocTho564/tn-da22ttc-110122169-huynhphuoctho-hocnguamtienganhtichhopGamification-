import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, CONTENT_STATUSES, readJsonObject, readOptionalString, readRequiredString, readStatus, requireAdminSession } from "@/lib/admin-api";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const soundGroupId = searchParams.get("soundGroupId");

    const where: Record<string, unknown> = {};
    if (soundGroupId) where.soundGroupId = soundGroupId;

    const items = await prisma.minimalPair.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        soundGroup: { select: { id: true, name: true } },
        wordA: { select: { id: true, word: true, ipa: true } },
        wordB: { select: { id: true, word: true, ipa: true } },
      },
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error("Admin list minimal pairs error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const soundGroupId = readRequiredString(body, "soundGroupId", 255);
    const wordAId = readRequiredString(body, "wordAId", 255);
    const wordBId = readRequiredString(body, "wordBId", 255);
    const note = readOptionalString(body, "note", 1000);
    const status = readStatus(body.status, CONTENT_STATUSES, "NEEDS_REVIEW");

    if (!soundGroupId || !wordAId || !wordBId) return apiFailure("VALIDATION_ERROR", "soundGroupId, wordAId, wordBId là bắt buộc", 400);
    if (!status) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const item = await prisma.minimalPair.create({
      data: {
        soundGroupId,
        wordAId,
        wordBId,
        note: note ?? null,
        status,
      },
      include: {
        soundGroup: { select: { id: true, name: true } },
        wordA: { select: { id: true, word: true, ipa: true } },
        wordB: { select: { id: true, word: true, ipa: true } },
      },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    console.error("Admin create minimal pair error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
