import { NextRequest } from "next/server";
import { MAP_STATUSES, apiFailure, apiSuccess, readJsonObject, readOptionalString, readRequiredString, readStatus, requireAdminSession } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

function serializeMap(map: {
  id: string;
  name: string;
  requirement: string | null;
  status: string;
  subcategory: string | null;
  requiredMapId: string | null;
  unlockThresholdPercent: number;
  requiredMap: { id: string; name: string } | null;
  _count: {
    exercises: number;
    progresses: number;
  };
}) {
  return {
    id: map.id,
    name: map.name,
    requirement: map.requirement,
    status: map.status,
    subcategory: map.subcategory,
    requiredMapId: map.requiredMapId,
    requiredMapName: map.requiredMap?.name ?? null,
    unlockThresholdPercent: map.unlockThresholdPercent,
    exerciseCount: map._count.exercises,
    progressCount: map._count.progresses,
  };
}

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const maps = await prisma.learningMap.findMany({
      orderBy: { name: "asc" },
      include: {
        requiredMap: { select: { id: true, name: true } },
        _count: {
          select: {
            exercises: true,
            progresses: true,
          },
        },
      },
    });

    return apiSuccess({ maps: maps.map(serializeMap) });
  } catch (error) {
    console.error("Admin list maps error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy learning map", 500);
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
    const requirement = readOptionalString(body, "requirement", 1000);
    const status = readStatus(body.status, MAP_STATUSES, "DRAFT");
    const subcategory = readOptionalString(body, "subcategory", 255);

    if (!name || requirement === null || !status) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu learning map không hợp lệ", 400);
    }

    const map = await prisma.learningMap.create({
      data: {
        name,
        requirement,
        status,
        ...(subcategory !== undefined ? { subcategory } : {}),
      },
      include: {
        requiredMap: { select: { id: true, name: true } },
        _count: {
          select: {
            exercises: true,
            progresses: true,
          },
        },
      },
    });

    return apiSuccess({ map: serializeMap(map) }, 201);
  } catch (error) {
    console.error("Admin create map error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo learning map", 500);
  }
}
