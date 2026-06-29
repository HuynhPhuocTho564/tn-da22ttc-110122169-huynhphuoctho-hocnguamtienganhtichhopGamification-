import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readNullableString, readRequiredString, requireAdminSession } from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializeTopic(topic: {
  id: string;
  name: string;
  description: string | null;
  _count: {
    exercises: number;
    soundGroups: number;
  };
}) {
  return {
    id: topic.id,
    name: topic.name,
    description: topic.description,
    exerciseCount: topic._count.exercises,
    soundGroupCount: topic._count.soundGroups,
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
      return apiFailure("VALIDATION_ERROR", "Dữ liệu cập nhật chủ đề không hợp lệ", 400);
    }

    const existing = await prisma.topic.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return apiFailure("TOPIC_NOT_FOUND", "Không tìm thấy chủ đề", 404);
    }

    const topic = await prisma.topic.update({
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

    return apiSuccess({ topic: serializeTopic(topic) });
  } catch (error) {
    console.error("Admin update topic error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi cập nhật chủ đề", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const topic = await prisma.topic.findUnique({
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

    if (!topic) {
      return apiFailure("TOPIC_NOT_FOUND", "Không tìm thấy chủ đề", 404);
    }

    if (topic._count.exercises > 0 || topic._count.soundGroups > 0) {
      return apiFailure("TOPIC_IN_USE", "Chủ đề đang được bài tập hoặc sound group sử dụng", 409, serializeTopic(topic));
    }

    await prisma.topic.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete topic error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi xóa chủ đề", 500);
  }
}
