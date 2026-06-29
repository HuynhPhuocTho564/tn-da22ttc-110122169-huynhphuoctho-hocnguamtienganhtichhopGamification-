import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMasteryData } from "@/lib/gamification/mastery";

/**
 * GET /api/mastery
 *
 * Returns mastery percentage for each topic and sound group.
 * Used by MasteryTree component on dashboard.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const userId = session.user.id;

    const [topics, userAttempts] = await Promise.all([
    prisma.topic.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        soundGroups: {
          where: { status: "ACTIVE" },
          orderBy: { orderIndex: "asc" },
          include: { _count: { select: { questionBankItems: true } } },
        },
      },
    }),
    prisma.exerciseAttempt.findMany({
      where: { userId },
      select: {
        exerciseId: true,
        score: true,
        exercise: {
          select: {
            map: {
              select: {
                subcategory: true,
                exercises: { select: { id: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const result = buildMasteryData(topics, userAttempts);

  return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[mastery] Error computing mastery:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể tải dữ liệu kỹ năng." } },
      { status: 500 },
    );
  }
}
