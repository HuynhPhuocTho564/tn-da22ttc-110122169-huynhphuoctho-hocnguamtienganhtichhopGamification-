import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  CONTENT_STATUSES,
  readJsonObject,
  readNullableString,
  readOptionalStatus,
  readOptionalString,
  readRequiredString,
  readStatus,
  requireAdminSession,
} from "@/lib/admin-api";

function serialize(item: {
  id: string;
  word: string;
  ipa: string;
  difficulty: string;
  status: string;
  meaningVi: string | null;
  reviewNote: string | null;
  phonemeId: string;
}) {
  return {
    id: item.id,
    word: item.word,
    ipa: item.ipa,
    difficulty: item.difficulty,
    status: item.status,
    meaningVi: item.meaningVi,
    reviewNote: item.reviewNote,
    phonemeId: item.phonemeId,
  };
}

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

    const items = await prisma.wordItem.findMany({
      where,
      orderBy: [{ word: "asc" }],
      include: {
        phoneme: { select: { id: true, symbol: true } },
      },
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error("Admin list word items error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const word = readRequiredString(body, "word", 255);
    const ipa = readRequiredString(body, "ipa", 255);
    const phonemeId = readRequiredString(body, "phonemeId", 255);
    const meaningVi = readOptionalString(body, "meaningVi", 1000);
    const reviewNote = readOptionalString(body, "reviewNote", 2000);
    const difficulty = typeof body.difficulty === "string" ? body.difficulty : "EASY";
    const status = readStatus(body.status, CONTENT_STATUSES, "NEEDS_REVIEW");

    if (!word || !ipa || !phonemeId) return apiFailure("VALIDATION_ERROR", "word, ipa, phonemeId là bắt buộc", 400);
    if (!status) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const item = await prisma.wordItem.create({
      data: {
        word,
        ipa,
        phonemeId,
        meaningVi: meaningVi ?? null,
        reviewNote: reviewNote ?? null,
        difficulty,
        status,
      },
    });

    return apiSuccess({ item: serialize(item) }, 201);
  } catch (error) {
    console.error("Admin create word item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
