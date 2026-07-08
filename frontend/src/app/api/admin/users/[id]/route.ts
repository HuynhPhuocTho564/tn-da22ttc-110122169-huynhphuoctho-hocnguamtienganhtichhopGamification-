import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readOptionalStatus, readRequiredString, requireAdminSession, USER_STATUSES } from "@/lib/admin-api";
type RouteContext = { params: Promise<{ id: string }> };

/** DELETE /api/admin/users/[id] - Delete a user */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!target) return apiFailure("NOT_FOUND", "Không tìm thấy người dùng", 404);

    // Cannot delete yourself
    if (target.id === admin.userId) {
      return apiFailure("SELF_DELETE", "Không thể xóa chính mình", 403);
    }

    // Cannot delete an admin
    if (target.role.name === "Admin") {
      return apiFailure("FORBIDDEN", "Không thể xóa tài khoản Admin", 403);
    }

    // Last-admin protection
    const adminCount = await prisma.user.count({
      where: { role: { name: "Admin" } },
    });
    if (target.role.name === "Admin" && adminCount <= 1) {
      return apiFailure("LAST_ADMIN", "Không thể xóa admin cuối cùng", 409);
    }

    await prisma.user.delete({ where: { id } });

    return apiSuccess({ message: "Đã xóa người dùng" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

/** PATCH /api/admin/users/[id] - Update user role and/or status */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    // Load target user with role for self/admin checks.
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!target) return apiFailure("NOT_FOUND", "Không tìm thấy người dùng", 404);

    const isSelf = target.id === admin.userId;
    const targetIsAdmin = target.role.name === "Admin";

    const status = readOptionalStatus(body.status, USER_STATUSES);
    const roleName = body.role === undefined ? undefined : readRequiredString(body, "role", 50);

    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);
    if (roleName === null) return apiFailure("VALIDATION_ERROR", "role không hợp lệ", 400);

    // Self-protection: admin cannot ban/deactivate themselves.
    if (isSelf && status !== undefined && status !== "ACTIVE") {
      return apiFailure("SELF_LOCKOUT", "Không thể tự khóa tài khoản admin đang đăng nhập", 403);
    }

    // Self-protection: admin cannot change their own role (would lose access).
    if (isSelf && roleName !== undefined) {
      return apiFailure("SELF_LOCKOUT", "Không thể tự thay đổi role của chính mình", 403);
    }

    // Privilege escalation guard: admin cannot modify another admin's role.
    if (targetIsAdmin && roleName !== undefined) {
      return apiFailure("FORBIDDEN", "Không thể thay đổi role của admin khác", 403);
    }

    // Last-admin protection: cannot demote/ban the last remaining admin.
    if (targetIsAdmin && (roleName !== undefined || (status !== undefined && status !== "ACTIVE"))) {
      const adminCount = await prisma.user.count({
        where: { role: { name: "Admin" } },
      });
      if (adminCount <= 1) {
        return apiFailure("LAST_ADMIN", "Không thể khóa/hạ cấp admin cuối cùng của hệ thống", 409);
      }
    }

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
