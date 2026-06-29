import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, CONTENT_STATUSES, readJsonObject, readOptionalString, readRequiredString, readStatus, requireAdminSession } from "@/lib/admin-api";

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const items = await prisma.soundGroup.findMany({
      orderBy: [{ topic: { name: "asc" } }, { name: "asc" }],
      include: {
        topic: { select: { id: true, name: true } },
        _count: { select: { phonemes: true, minimalPairs: true, sentenceItems: true } },
      },
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error("Admin list sound groups error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const name = readRequiredString(body, "name", 255);
    const description = readOptionalString(body, "description", 1000);
    const topicId = readOptionalString(body, "topicId", 255);
    const status = readStatus(body.status, CONTENT_STATUSES, "DRAFT");

    if (!name) return apiFailure("VALIDATION_ERROR", "name là bắt buộc", 400);
    if (!status) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const item = await prisma.soundGroup.create({
      data: {
        name,
        description: description ?? null,
        topicId: topicId ?? null,
        status,
      },
      include: {
        topic: { select: { id: true, name: true } },
        _count: { select: { phonemes: true, minimalPairs: true, sentenceItems: true } },
      },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    console.error("Admin create sound group error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
