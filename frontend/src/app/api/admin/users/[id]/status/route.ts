import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Chưa đăng nhập" } }, { status: 401 });
  }

  // Check admin role
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  });
  if (adminUser?.role?.name !== "ADMIN") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Không có quyền" } }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !["ACTIVE", "INACTIVE", "BANNED"].includes(status)) {
    return NextResponse.json({ success: false, error: { code: "INVALID_STATUS", message: "Trạng thái không hợp lệ" } }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, username: true, status: true },
    });

    return NextResponse.json({ success: true, data: { user: updated } });
  } catch {
    return NextResponse.json({ success: false, error: { code: "UPDATE_FAILED", message: "Cập nhật thất bại" } }, { status: 500 });
  }
}
