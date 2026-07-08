import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readOptionalString, readRequiredString, requireAdminSession } from "@/lib/admin-api";

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

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const topics = await prisma.topic.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            exercises: true,
            soundGroups: true,
          },
        },
      },
    });

    return apiSuccess({
      topics: topics.map(serializeTopic),
    });
  } catch (error) {
    console.error("Admin list topics error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy chủ đề", 500);
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

    const name = readRequiredString(body, "name", 255);
    const description = readOptionalString(body, "description", 1000);

    if (!name || description === null) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu chủ đề không hợp lệ", 400);
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        description,
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

    return apiSuccess({ topic: serializeTopic(topic) }, 201);
  } catch (error) {
    console.error("Admin create topic error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo chủ đề", 500);
  }
}
