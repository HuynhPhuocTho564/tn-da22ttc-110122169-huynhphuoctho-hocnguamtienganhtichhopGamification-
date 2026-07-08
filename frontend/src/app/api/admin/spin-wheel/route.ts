import { SPIN_WHEEL_PRIZES } from "@/lib/gamification/spin-wheel";
import { apiFailure, apiSuccess, requireAdminSession } from "@/lib/admin-api";

/** GET /api/admin/spin-wheel - List all prize cells (from hardcoded config) */
export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const prizes = SPIN_WHEEL_PRIZES.map((p, i) => ({
      id: p.id,
      key: p.id,
      label: p.label,
      shortLabel: p.shortLabel,
      icon: p.icon,
      prize: p.id,
      prizeValue: p.value.gems ?? p.value.xp ?? p.value.streakFreezes ?? 0,
      weight: p.weight,
      sortOrder: i * 10,
      status: "ACTIVE" as const,
    }));

    return apiSuccess({ prizes });
  } catch (error) {
    console.error("Admin list spin wheel prizes error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
