/**
 * MissionCard — 1 thẻ nhiệm vụ trong bảng nhiệm vụ hôm nay.
 *
 * Server component. Render title + description + progress bar + reward.
 * Bold/normal typography theo WCAG AAA (text-neutral-900, không gray).
 */

interface MissionCardProps {
  readonly title: string;
  readonly description: string;
  readonly target: number;
  readonly progress: number;
  readonly rewardXp: number;
  readonly rewardGems: number;
}

export default function MissionCard({
  title,
  description,
  target,
  progress,
  rewardXp,
  rewardGems,
}: MissionCardProps) {
  const percent = Math.min(100, Math.round((progress / target) * 100));
  const completed = progress >= target;

  return (
    <li
      className={`rounded-xl border-2 p-5 shadow-sm transition ${
        completed
          ? "border-success-300 bg-success-50"
          : "border-primary-200 bg-white"
      }`}
      aria-label={`${title}: ${progress}/${target}`}
    >
      {/* Title + description */}
      <p
        className={`text-lg font-bold ${
          completed ? "text-success-800" : "text-neutral-900"
        }`}
      >
        {completed ? "✓ " : ""}
        {title}
      </p>
      <p className="mt-1 text-sm font-normal text-neutral-900">{description}</p>

      {/* Progress bar + counter */}
      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={progress}
          aria-label={`${title}: ${progress}/${target}`}
        >
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${
              completed ? "bg-success-500" : "bg-primary-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">
          {progress}/{target}
        </span>
      </div>

      {/* Reward */}
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
          +{rewardGems}💎 +{rewardXp}EXP
        </span>
        {completed && (
          <span className="text-xs font-bold text-success-800">✓ Hoàn thành</span>
        )}
      </div>
    </li>
  );
}
