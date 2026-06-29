import Card from "@/components/ui/Card";
import type { WeekCountdown } from "@/lib/gamification/league-zone";

/**
 * WeekCountdown — hiển thị thời gian còn lại đến lúc giải đấu tuần kết thúc
 * (Thứ Hai 00:00 ICT = CN 17:00 UTC).
 *
 * Skill nielsen-ux-heuristics:
 *  - H1 Visibility of system status: user luôn biết deadline
 *  - H8 Aesthetic: chỉ 1 thẻ, không chiếm chỗ, gradient tinh tế
 *  - Doherty Threshold + Goal-Gradient: deadline cụ thể → urgency → tăng effort
 *
 * Skill ui-color-harmony:
 *  - isLastDay → gradient error→amber + animate-pulse (urgency), WCAG text-white AAA
 *  - bình thường → primary→accent, contrast ≥4.5:1
 *
 * @example
 *   {data?.weekCountdown && <WeekCountdown countdown={data.weekCountdown} />}
 */
type Props = {
  countdown: WeekCountdown;
};

export default function WeekCountdown({ countdown }: Props) {
  const { daysLeft, hoursLeft, minutesLeft, isLastDay, period } = countdown;

  const gradientClass = isLastDay
    ? "bg-gradient-to-r from-error-500 to-amber-500"
    : "bg-gradient-to-r from-primary-500 to-accent-500";

  const pulseClass = isLastDay ? "animate-pulse" : "";

  return (
    <Card
      className={`mb-6 ${gradientClass} ${pulseClass} border-0 text-white shadow-lg`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-4 text-center">
        <span className="text-4xl" aria-hidden>
          {isLastDay ? "🔥" : "⏰"}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
            {isLastDay ? "Sắp kết thúc!" : "Giải đấu tuần này kết thúc sau"}
          </p>
          <p className="text-3xl font-black tabular-nums" data-testid="countdown-value">
            {formatCountdown(daysLeft, hoursLeft, minutesLeft)}
          </p>
          <p className="mt-1 text-xs opacity-80">Tuần {period}</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Format countdown cho dễ đọc:
 *  - "2 ngày 14 giờ 30 phút"
 *  - "0 ngày 5 giờ 12 phút" (ẩn "0 ngày" nếu <1 ngày)
 *  - "0 giờ 45 phút" (ẩn cả ngày lẫn giờ nếu <1 giờ)
 */
function formatCountdown(daysLeft: number, hoursLeft: number, minutesLeft: number): string {
  const parts: string[] = [];
  if (daysLeft > 0) parts.push(`${daysLeft} ngày`);
  if (daysLeft > 0 || hoursLeft > 0) parts.push(`${hoursLeft} giờ`);
  parts.push(`${minutesLeft} phút`);
  return parts.join(" ");
}
