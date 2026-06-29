import { apiSuccess, apiFailure } from "@/lib/admin-api";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashPasswordResetToken } from "@/lib/password-reset";

type ResetPasswordPayload = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as ResetPasswordPayload;
    const token = payload.token?.trim();
    const password = payload.password ?? "";

    if (!token) {
      return apiFailure("VALIDATION_ERROR", "Thiếu token đặt lại mật khẩu", 400);
    }

    if (password.length < 6) {
      return apiFailure("VALIDATION_ERROR", "Mật khẩu phải có ít nhất 6 ký tự", 400);
    }

    const tokenHash = hashPasswordResetToken(token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      return apiFailure("TOKEN_INVALID", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: { not: resetToken.id },
        },
        data: { usedAt: new Date() },
      }),
    ]);

    return apiSuccess({ message: "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại." });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi đặt lại mật khẩu", 500);
  }
}
