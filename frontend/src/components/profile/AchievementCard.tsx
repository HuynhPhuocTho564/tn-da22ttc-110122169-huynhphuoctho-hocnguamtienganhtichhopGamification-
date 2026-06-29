import {
  TIER_DISPLAY,
  isValidTier,
  type LeagueTier,
} from "@/lib/gamification/league";

/**
 * AchievementCard — thẻ vinh danh thành tích cá nhân trên trang Profile.
 *
 * Skill nielsen-ux-heuristics:
 *  - H4 Consistency: dùng chung 1 layout cho 4 cards
 *  - Aesthetic-Usability (Norman): card đẹp → user cảm thấy "thành quả" → retention
 *  - H8 Minimalist: chỉ icon + label + value, không clutter
 *
 * Skill ui-color-harmony:
 *  - 60-30-10: bg-gradient primary-50→accent-50 (secondary), icon primary-500 (accent),
 *    text neutral-900 (dominant). Contrast neutral-900 trên primary-50 ~16:1 = AAA.
 *  - Tier variant: dùng TIER_DISPLAY[tier].gradient cho badge → semantic hue riêng
 *    cho currency/tier (không vi phạm "state color" rule của skill).
 *
 * Skill maintainable-code:
 *  - 1 trách nhiệm: render 1 achievement card
 *  - Discriminated union cho props → type-safe, không optional chaining lung tung
 *  - Component ≤50 dòng (ngoại trừ doc comment)
 */
export type AchievementCardProps =
  | {
      variant?: "default";
      icon: string;
      label: string;
      value: string;
    }
  | {
      variant: "tier";
      icon: string;
      label: string;
      value: string;
      tier: LeagueTier;
    };

export default function AchievementCard(props: AchievementCardProps) {
  const tierInfo =
    props.variant === "tier" && isValidTier(props.tier)
      ? TIER_DISPLAY[props.tier]
      : null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-primary-50 to-accent-50 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl" aria-hidden>
          {props.icon}
        </span>
        {tierInfo && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${tierInfo.badgeClass}`}
          >
            {tierInfo.icon} {tierInfo.name}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-neutral-600">{props.label}</p>
      <p className="mt-1 text-2xl font-black text-neutral-900 tabular-nums break-words">
        {props.value}
      </p>
    </div>
  );
}
