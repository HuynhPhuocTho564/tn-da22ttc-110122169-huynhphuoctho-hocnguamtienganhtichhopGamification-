/**
 * MainQuestCard — 1 thẻ nhiệm vụ chính (Main Quest).
 *
 * Server component. Render title + items list + progress + reward.
 * Mỗi quest có nhiều items (islands, camps, levels).
 */

import ClaimButton from "@/components/gamification/ClaimButton";

interface MainQuestItem {
  readonly id: string;
  readonly name: string;
  readonly completed: boolean;
  readonly claimedAt: string | null;
}

interface MainQuestCardProps {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly rewardXp: number;
  readonly rewardGems: number;
  readonly items: readonly MainQuestItem[];
}

export default function MainQuestCard({
  type,
  title,
  description,
  rewardXp,
  rewardGems,
  items,
}: MainQuestCardProps) {
  const completedCount = items.filter((i) => i.completed).length;
  const allCompleted = completedCount === items.length && items.length > 0;

  return (
    <div
      className={`rounded-xl border-2 p-5 shadow-sm transition ${
        allCompleted && items.every((i) => i.claimedAt)
          ? "border-success-300 bg-success-50"
          : "border-primary-200 bg-white"
      }`}
    >
      {/* Title + description */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-lg font-bold ${
              allCompleted && items.every((i) => i.claimedAt)
                ? "text-success-800"
                : "text-neutral-900"
            }`}
          >
            {allCompleted && items.every((i) => i.claimedAt) ? "✓ " : ""}
            {title}
          </p>
          <p className="mt-1 text-sm font-normal text-neutral-900">
            {description}
          </p>
        </div>
        <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
          +{rewardGems}💎 +{rewardXp}EXP
        </span>
      </div>

      {/* Progress summary */}
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={completedCount}
          aria-label={`${title}: ${completedCount}/${items.length}`}
        >
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${
              allCompleted ? "bg-success-500" : "bg-primary-500"
            }`}
            style={{
              width: `${items.length > 0 ? Math.min(100, Math.round((completedCount / items.length) * 100)) : 0}%`,
            }}
          />
        </div>
        <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">
          {completedCount}/{items.length}
        </span>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <span
                className={
                  item.completed ? "text-success-700 font-medium" : "text-neutral-700"
                }
              >
                {item.completed ? "✓" : "○"} {item.name}
              </span>
              {item.completed && item.claimedAt && (
                <span className="text-xs font-bold text-success-600">
                  Đã nhận
                </span>
              )}
              {item.completed && !item.claimedAt && (
                <ClaimButton
                  questType={type}
                  targetId={item.id}
                  onClaimed={() => {
                    // Force page refresh to update state
                    window.location.reload();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <p className="mt-3 text-sm text-neutral-500 italic">
          Hoàn thành bài tập để mở khóa nhiệm vụ này
        </p>
      )}
    </div>
  );
}
