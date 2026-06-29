import { apiSuccess, apiFailure } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  getPasswordResetExpiresAt,
  hashPasswordResetToken,
  isValidEmail,
  normalizeEmail,
} from "@/lib/password-reset";

type ForgotPasswordPayload = {
  email?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as ForgotPasswordPayload;
    const email = normalizeEmail(payload.email ?? "");

    if (!email || !isValidEmail(email)) {
      return apiFailure("VALIDATION_ERROR", "Email không hợp lệ", 400);
    }

    const genericMessage = "Nếu email tồn tại, hệ thống đã tạo liên kết đặt lại mật khẩu.";
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return apiSuccess({ message: genericMessage });
    }

    const token = createPasswordResetToken();
    const resetUrl = buildPasswordResetUrl(request, token);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashPasswordResetToken(token),
        expiresAt: getPasswordResetExpiresAt(),
      },
    });

    // Demo/local fallback: when email sending is not configured, expose the link in development.
    if (process.env.NODE_ENV !== "production") {
      console.info(`Password reset link for ${user.email}: ${resetUrl}`);
    }

    return apiSuccess({
      message: genericMessage,
      ...(process.env.NODE_ENV !== "production" ? { resetUrl } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo liên kết đặt lại mật khẩu", 500);
  }
}
