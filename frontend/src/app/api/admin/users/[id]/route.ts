import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readOptionalStatus, readRequiredString, requireAdminSession, USER_STATUSES } from "@/lib/admin-api";
type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/users/[id] - Update user role and/or status */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy người dùng", 404);

    const status = readOptionalStatus(body.status, USER_STATUSES);
    const roleName = body.role === undefined ? undefined : readRequiredString(body, "role", 50);

    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);
    if (roleName === null) return apiFailure("VALIDATION_ERROR", "role không hợp lệ", 400);

    // Resolve role by name
    let roleId: string | undefined;
    if (roleName !== undefined) {
      const role = await prisma.role.findUnique({ where: { name: roleName }, select: { id: true } });
      if (!role) return apiFailure("ROLE_NOT_FOUND", `Không tìm thấy role "${roleName}"`, 404);
      roleId = role.id;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(roleId !== undefined ? { roleId } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        role: { select: { name: true } },
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    console.error("Admin update user error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
