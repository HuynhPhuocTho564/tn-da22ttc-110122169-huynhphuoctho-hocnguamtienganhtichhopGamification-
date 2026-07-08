import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readNullableString, readRequiredString, requireAdminSession } from "@/lib/admin-api";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/badges/[id] - Update badge */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const existing = await prisma.badge.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy badge", 404);

    const name = body.name === undefined ? undefined : readRequiredString(body, "name", 255);
    const description = readNullableString(body, "description", 1000);
    const image = readNullableString(body, "image", 500);
    const condition = readNullableString(body, "condition", 1000);
    const type = body.type === undefined
      ? undefined
      : typeof body.type === "string"
        ? body.type
        : null;

    if (name === null) return apiFailure("VALIDATION_ERROR", "name không hợp lệ", 400);
    if (description === false || image === false || condition === false) return apiFailure("VALIDATION_ERROR", "text không hợp lệ", 400);
    if (type === null) return apiFailure("VALIDATION_ERROR", "type không hợp lệ", 400);

    const badge = await prisma.badge.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(condition !== undefined ? { condition } : {}),
        ...(type !== undefined ? { type } : {}),
      },
    });

    return apiSuccess({ badge });
  } catch (error) {
    console.error("Admin update badge error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

/** DELETE /api/admin/badges/[id] - Delete badge */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const existing = await prisma.badge.findUnique({
      where: { id },
      include: { _count: { select: { userBadges: true } } },
    });

    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy badge", 404);

    if (existing._count.userBadges > 0) {
      return apiFailure("IN_USE", "Badge đang có người dùng sở hữu", 409);
    }

    await prisma.badge.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete badge error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
