import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, email } = body;

    // Validation
    if (!username || username.length < 3) {
      return NextResponse.json(
        { error: "Tên người dùng phải có ít nhất 3 ký tự" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    // Check if username is taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: { not: session.user.id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Tên người dùng đã được sử dụng" },
        { status: 400 }
      );
    }

    // Check if email is taken by another user
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        id: { not: session.user.id },
      },
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 400 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username,
        email,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("[Profile Update Error]", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi cập nhật hồ sơ" },
      { status: 500 }
    );
  }
}
