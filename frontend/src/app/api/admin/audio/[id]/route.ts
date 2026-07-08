import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  readJsonObject,
  readNullableInt,
  readOptionalString,
  requireAdminSession,
} from "@/lib/admin-api";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const existing = await prisma.audioFile.findUnique({ where: { id } });
    if (!existing) {
      return apiFailure("NOT_FOUND", "Không tìm thấy audio", 404);
    }

    const path = readOptionalString(body, "path", 500);
    if (path === null) {
      return apiFailure("VALIDATION_ERROR", "path không hợp lệ", 400);
    }

    const duration = readNullableInt(body, "duration", 0, 86400);
    if (duration === false) {
      return apiFailure("VALIDATION_ERROR", "duration không hợp lệ", 400);
    }

    const playLimit = readNullableInt(body, "playLimit", 0, 10000);
    if (playLimit === false) {
      return apiFailure("VALIDATION_ERROR", "playLimit không hợp lệ", 400);
    }

    if (path && path !== existing.path) {
      const dup = await prisma.audioFile.findFirst({ where: { path, id: { not: id } } });
      if (dup) {
        return apiFailure("DUPLICATE", "Đường dẫn audio đã tồn tại", 409);
      }
    }

    const audio = await prisma.audioFile.update({
      where: { id },
      data: {
        ...(path !== undefined ? { path } : {}),
        ...(duration !== undefined ? { duration: duration ?? null } : {}),
        ...(playLimit !== undefined ? { playLimit: playLimit ?? null } : {}),
      },
      include: { _count: { select: { exercises: true } } },
    });

    return apiSuccess({ audio: serializeAudio(audio) });
  } catch (error) {
    console.error("Admin update audio error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi cập nhật audio", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.audioFile.findUnique({
      where: { id },
      include: { _count: { select: { exercises: true } } },
    });

    if (!existing) {
      return apiFailure("NOT_FOUND", "Không tìm thấy audio", 404);
    }

    if (existing._count.exercises > 0) {
      return apiFailure("IN_USE", "Audio đang được sử dụng trong bài tập", 409);
    }

    await prisma.audioFile.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete audio error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi xóa audio", 500);
  }
}
