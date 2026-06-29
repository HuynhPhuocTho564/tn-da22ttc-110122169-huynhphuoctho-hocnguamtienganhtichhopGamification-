import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readNullableString, readRequiredString, requireAdminSession } from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeLevel(level: {
  id: string;
  name: string;
  description: string | null;
  _count: {
    exercises: number;
    soundGroups: number;
  };
}) {
  return {
    id: level.id,
    name: level.name,
    description: level.description,
    exerciseCount: level._count.exercises,
    soundGroupCount: level._count.soundGroups,
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

    const name = body.name === undefined ? undefined : readRequiredString(body, "name", 255);
    const description = readNullableString(body, "description", 1000);

    if (name === null || description === false) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu cập nhật cấp độ không hợp lệ", 400);
    }

    const existing = await prisma.level.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return apiFailure("LEVEL_NOT_FOUND", "Không tìm thấy cấp độ", 404);
    }

    const level = await prisma.level.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      include: {
        _count: {
          select: {
            exercises: true,
            soundGroups: true,
          },
        },
      },
    });

    return apiSuccess({ level: serializeLevel(level) });
  } catch (error) {
    console.error("Admin update level error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi cập nhật cấp độ", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const level = await prisma.level.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            exercises: true,
            soundGroups: true,
          },
        },
      },
    });

    if (!level) {
      return apiFailure("LEVEL_NOT_FOUND", "Không tìm thấy cấp độ", 404);
    }

    if (level._count.exercises > 0 || level._count.soundGroups > 0) {
      return apiFailure("LEVEL_IN_USE", "Cấp độ đang được bài tập hoặc sound group sử dụng", 409, serializeLevel(level));
    }

    await prisma.level.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete level error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi xóa cấp độ", 500);
  }
}
