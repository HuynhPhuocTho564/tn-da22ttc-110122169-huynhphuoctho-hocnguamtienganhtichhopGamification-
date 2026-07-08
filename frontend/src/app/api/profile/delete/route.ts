import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user and all related data (cascade delete)
    // Prisma will automatically delete related records if schema has onDelete: Cascade
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Tài khoản đã được xóa",
    });
  } catch (error) {
    console.error("[Delete Account Error]", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xóa tài khoản" },
      { status: 500 }
    );
  }
}
