import { apiSuccess, apiFailure } from "@/lib/admin-api";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type RegisterPayload = {
  username?: string;
  email?: string;
  password?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => ({}))) as RegisterPayload;
    const username = payload.username?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? "";

    if (!username || !email || !password) {
      return apiFailure("VALIDATION_ERROR", "Thiếu thông tin bắt buộc", 400);
    }

    if (username.length < 3) {
      return apiFailure("VALIDATION_ERROR", "Tên hiển thị phải có ít nhất 3 ký tự", 400);
    }

    if (!isValidEmail(email)) {
      return apiFailure("VALIDATION_ERROR", "Email không hợp lệ", 400);
    }

    if (password.length < 6) {
      return apiFailure("VALIDATION_ERROR", "Mật khẩu phải có ít nhất 6 ký tự", 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existingUser?.email === email) {
      return apiFailure("EMAIL_EXISTS", "Email đã được sử dụng", 409);
    }

    if (existingUser?.username === username) {
      return apiFailure("USERNAME_EXISTS", "Tên hiển thị đã được sử dụng", 409);
    }

    const defaultRole = await prisma.role.upsert({
      where: { name: "User" },
      update: {},
      create: { name: "User" },
    });
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        roleId: defaultRole.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return apiSuccess(
      {
        message: "Đăng ký thành công",
        user,
      },
      201,
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi đăng ký", 500);
  }
}
