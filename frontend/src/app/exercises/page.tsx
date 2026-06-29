import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getStatusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "LOCKED") return "warning" as const;
  return "default" as const;
}

export default async function ExercisesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "Admin";

  const exercises = await prisma.exercise.findMany({
    where: isAdmin
      ? { status: { not: "ARCHIVED" } }
      : { status: "ACTIVE" },
    orderBy: [{ map: { name: "asc" } }, { name: "asc" }],
    include: {
      topic: {
        select: {
          name: true,
        },
      },
      level: {
        select: {
          name: true,
        },
      },
      map: {
        select: {
          name: true,
          requirement: true,
        },
      },
      _count: {
        select: {
          questions: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/learning_map"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition-colors hover:border-primary-300 hover:text-primary-700"
          >
            <span aria-hidden="true">←</span> Lộ trình
          </Link>
        </div>
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Bài tập luyện phát âm</h1>
          <p className="text-lg text-neutral-600">
            Chọn bài tập để luyện nghe, nói từ, minimal pair và câu ngắn. Kết quả sẽ được lưu vào EXP, badge và bảng xếp hạng.
          </p>
        </div>

        {exercises.length === 0 ? (
          <Card>
            <p className="text-neutral-600">
              Chưa có bài tập nào. Vui lòng quay lại sau.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exercises.map((exercise) => {
              const isActive = exercise.status === "ACTIVE";

              return (
                <Card key={exercise.id} className={isActive ? "" : "opacity-80"}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">
                        {exercise.map.name}
                      </p>
                      <h2 className="text-2xl font-bold text-neutral-900">{exercise.name}</h2>
                    </div>
                    <Badge variant={getStatusVariant(exercise.status)} size="sm">
                      {exercise.status}
                    </Badge>
                  </div>

                  <p className="text-neutral-600 mb-5">
                    {exercise.description || "Bài tập luyện phát âm tiếng Anh."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                      <div className="text-xs text-neutral-500">Chủ đề</div>
                      <div className="font-semibold text-neutral-900">{exercise.topic.name}</div>
                    </div>
                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                      <div className="text-xs text-neutral-500">Cấp độ</div>
                      <div className="font-semibold text-neutral-900">{exercise.level.name}</div>
                    </div>
                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                      <div className="text-xs text-neutral-500">Số câu</div>
                      <div className="font-semibold text-neutral-900">{exercise._count.questions}</div>
                    </div>
                    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3">
                      <div className="text-xs text-neutral-500">Yêu cầu</div>
                      <div className="font-semibold text-neutral-900">{exercise.map.requirement || "Mở"}</div>
                    </div>
                  </div>

                  {isActive ? (
                    <Link
                      href={`/exercises/${exercise.id}`}
                      className="inline-flex w-full justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors"
                    >
                      Bắt đầu làm bài
                    </Link>
                  ) : (
                    <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700">
                      Bài này đang ở trạng thái {exercise.status}. Có thể mở sau khi nội dung được duyệt.
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
