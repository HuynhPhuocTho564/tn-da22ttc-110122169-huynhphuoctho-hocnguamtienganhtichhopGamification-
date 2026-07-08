import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  readJsonObject,
  readNullableInt,
  readRequiredString,
  requireAdminSession,
} from "@/lib/admin-api";

function serializeAudio(a: {
  id: string;
  path: string;
  duration: number | null;
  playLimit: number | null;
  _count?: { exercises: number };
}) {
  return {
    id: a.id,
    path: a.path,
    duration: a.duration,
    playLimit: a.playLimit,
    usedIn: a._count?.exercises ?? 0,
  };
}

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const audioFiles = await prisma.audioFile.findMany({
      orderBy: { path: "asc" },
      include: { _count: { select: { exercises: true } } },
    });

    return apiSuccess({ audioFiles: audioFiles.map(serializeAudio) });
  } catch (error) {
    console.error("Admin list audio files error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy danh sách audio", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const path = readRequiredString(body, "path", 500);
    if (!path) {
      return apiFailure("VALIDATION_ERROR", "path là bắt buộc", 400);
    }

    const duration = readNullableInt(body, "duration", 0, 86400);
    if (duration === false) {
      return apiFailure("VALIDATION_ERROR", "duration không hợp lệ", 400);
    }

    const playLimit = readNullableInt(body, "playLimit", 0, 10000);
    if (playLimit === false) {
      return apiFailure("VALIDATION_ERROR", "playLimit không hợp lệ", 400);
    }

    const existing = await prisma.audioFile.findFirst({ where: { path } });
    if (existing) {
      return apiFailure("DUPLICATE", "Đường dẫn audio đã tồn tại", 409);
    }

    const audio = await prisma.audioFile.create({
      data: { path, duration: duration ?? null, playLimit: playLimit ?? null },
      include: { _count: { select: { exercises: true } } },
    });

    return apiSuccess({ audio: serializeAudio(audio) }, 201);
  } catch (error) {
    console.error("Admin create audio error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo audio", 500);
  }
}
