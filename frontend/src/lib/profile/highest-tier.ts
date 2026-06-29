import { prisma } from "@/lib/prisma";
import { TIER_ORDER, type LeagueTier } from "@/lib/gamification/league";

/**
 * Lấy hạng cao nhất user từng đạt (vanity metric cho Profile Achievement Cards).
 *
 * Logic:
 *  - Lấy currentTier hiện tại của user
 *  - Lấy tất cả toTier trong SeasonTransitionLog của user
 *  - Trả về tier cao nhất theo TIER_ORDER ranking
 *
 * Dùng cho Achievement Card "Hạng cao nhất từng đạt" — kích hoạt
 * Sunk Cost Fallacy (Tversky & Kahneman) → tăng Long-term Retention.
 *
 * Edge case: user mới chưa có transition log → fallback về currentTier (mặc định "bronze").
 *
 * @example
 *   const highest = await getHighestTier(userId); // "gold"
 */
export async function getHighestTier(userId: string): Promise<LeagueTier> {
  const [user, logs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentTier: true },
    }),
    prisma.seasonTransitionLog.findMany({
      where: { userId },
      select: { toTier: true },
    }),
  ]);

  if (!user) return "bronze";

  const candidates: string[] = [user.currentTier, ...logs.map((l) => l.toTier)];

  const ranked = candidates
    .filter((t): t is LeagueTier =>
      (TIER_ORDER as readonly string[]).includes(t),
    )
    .sort(
      (a, b) => TIER_ORDER.indexOf(b) - TIER_ORDER.indexOf(a),
    );

  return ranked[0] ?? "bronze";
}
