import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, requireAdminSession } from "@/lib/admin-api";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");

    if (!exerciseId) {
      return apiFailure("VALIDATION_ERROR", "Thiếu exerciseId", 400);
    }

    const questions = await prisma.question.findMany({
      where: { exerciseId },
      orderBy: { id: "asc" },
      include: {
        type: { select: { id: true, name: true } },
        _count: { select: { options: true } },
      },
    });

    return apiSuccess({
      questions: questions.map((q) => ({
        id: q.id,
        exerciseId: q.exerciseId,
        name: q.name,
        content: q.content,
        status: q.status,
        score: q.score,
        answer: q.answer,
        type: q.type,
        optionCount: q._count.options,
      })),
    });
  } catch (error) {
    console.error("Admin list questions error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tải câu hỏi", 500);
  }
}
