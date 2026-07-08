import { NextRequest } from "next/server";
import { MAP_STATUSES, apiFailure, apiSuccess, readJsonObject, readNullableString, readOptionalStatus, readRequiredString, requireAdminSession } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    const requirement = readNullableString(body, "requirement", 1000);
    const status = readOptionalStatus(body.status, MAP_STATUSES);
    const subcategory = readNullableString(body, "subcategory", 255);

    if (name === null || requirement === false || status === null || subcategory === false) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu cập nhật learning map không hợp lệ", 400);
    }

    const existing = await prisma.learningMap.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return apiFailure("MAP_NOT_FOUND", "Không tìm thấy learning map", 404);
    }

    const map = await prisma.learningMap.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(requirement !== undefined ? { requirement } : {}),
        ...(status !== undefined ? { status } : {}),
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

    return apiSuccess({ map: serializeMap(map) });
  } catch (error) {
    console.error("Admin update map error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi cập nhật learning map", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.learningMap.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return apiFailure("MAP_NOT_FOUND", "Không tìm thấy learning map", 404);
    }

    const map = await prisma.learningMap.update({
      where: { id },
      data: {
        status: "ARCHIVED",
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

    return apiSuccess({ map: serializeMap(map) });
  } catch (error) {
    console.error("Admin archive map error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lưu trữ learning map", 500);
  }
}
