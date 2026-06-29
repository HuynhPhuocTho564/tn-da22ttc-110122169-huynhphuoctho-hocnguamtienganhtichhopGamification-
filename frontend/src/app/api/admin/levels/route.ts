import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readOptionalString, readRequiredString, requireAdminSession } from "@/lib/admin-api";

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

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const levels = await prisma.level.findMany({
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

    return apiSuccess({ levels: levels.map(serializeLevel) });
  } catch (error) {
    console.error("Admin list levels error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy cấp độ", 500);
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
      return apiFailure("VALIDATION_ERROR", "Dữ liệu cấp độ không hợp lệ", 400);
    }

    const level = await prisma.level.create({
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

    return apiSuccess({ level: serializeLevel(level) }, 201);
  } catch (error) {
    console.error("Admin create level error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo cấp độ", 500);
  }
}
