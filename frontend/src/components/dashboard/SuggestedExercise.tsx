import Link from "next/link";
import Card from "@/components/ui/Card";

/**
 * SuggestedExercise — card "Gợi ý hôm nay", 1-click vào bài chưa hoàn thành tiếp theo.
 *
 * Giảm Hick's Law (1 lựa chọn thay vì duyệt list), dùng Von Restorff (nút nổi bật),
 * Goal-Gradient (tiếp tục chuỗi học) (Nielsen UX heuristics).
 *
 * Server component (nhận props từ dashboard query, không cần client state).
 * Nếu không có bài gợi ý → trả null (ẩn card, không hiển thị empty state).
 *
 * @module dashboard/SuggestedExercise
 */

type SuggestedExerciseProps = {
  exercise: {
    id: string;
    name: string;
    description: string | null;
    topicName: string;
    mapName: string;
  } | null;
};

const PRIMARY_LINK_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

export default function SuggestedExercise({ exercise }: SuggestedExerciseProps) {
  if (!exercise) return null;

  return (
    <div data-tour="suggested">
      <Card className="border-primary-300 bg-gradient-to-r from-primary-50 to-white">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-600">
          📌 Gợi ý hôm nay
        </p>
        <h3 className="mb-1 text-xl font-bold text-neutral-900">{exercise.name}</h3>
        <p className="mb-4 text-sm text-neutral-600">
          {exercise.topicName} → {exercise.mapName}
        </p>
        {exercise.description && (
          <p className="mb-4 text-sm text-neutral-500">{exercise.description}</p>
        )}
        <Link
          href={`/exercises/${exercise.id}`}
          className={PRIMARY_LINK_CLASS}
          aria-label={`Bắt đầu luyện tập bài ${exercise.name}`}
        >
          Bắt đầu luyện tập →
        </Link>
      </Card>
    </div>
  );
}
