import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/avatar";
import ProfileForm from "./ProfileForm";
import AchievementCard from "@/components/profile/AchievementCard";
import { TIER_DISPLAY, isValidTier, type LeagueTier } from "@/lib/gamification/league";
import { getHighestTier } from "@/lib/profile/highest-tier";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const [user, highestTier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        level: true,
        xp: true,
        longestStreak: true,
        createdAt: true,
        streakFreezes: true,
        xpBoostRemaining: true,
        hintTokens: true,
        secondChances: true,
      },
    }),
    getHighestTier(session.user.id),
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/profile");
  }

  const avatarUrl = getAvatarUrl(user.username, user.avatarUrl);

  const inventoryItems = [
    { icon: "❄️", name: "Bùa Đóng Băng", count: user.streakFreezes },
    { icon: "📖", name: "Sách Thần", count: user.xpBoostRemaining },
    { icon: "💡", name: "Gợi Ý Vàng", count: user.hintTokens },
    { icon: "🔄", name: "Cơ Hội Thứ Hai", count: user.secondChances },
  ].filter((item) => item.count > 0);

  const tierInfo: LeagueTier | null = isValidTier(highestTier) ? highestTier : null;
  const tierDisplay = tierInfo ? TIER_DISPLAY[tierInfo] : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900">Hồ sơ của tôi</h1>
          <p className="mt-2 text-neutral-600">
            Quản lý thông tin tài khoản và cài đặt cá nhân
          </p>
        </div>

        {/* ═══ Achievement Cards — vanity metrics (THIETKE) ═══ */}
        <section aria-labelledby="achievements-heading" className="mb-10">
          <h2
            id="achievements-heading"
            className="mb-4 text-lg font-bold text-neutral-900"
          >
            🏆 Thành tích mọi thời đại
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AchievementCard
              icon="⭐"
              label="Tổng EXP"
              value={user.xp.toLocaleString("vi-VN")}
            />
            <AchievementCard
              icon="🔥"
              label="Streak dài nhất"
              value={`${user.longestStreak} ngày`}
            />
            <AchievementCard
              icon="🏆"
              label="Hạng cao nhất"
              value={tierDisplay?.name ?? "Đồng"}
              variant="tier"
              tier={highestTier}
            />
            <AchievementCard
              icon="📅"
              label="Ngày gia nhập"
              value={formatJoinDate(user.createdAt)}
            />
          </div>
        </section>

        {/* Inventory summary */}
        <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900">🎒 Vật phẩm</h2>
            <Link
              href="/inventory"
              className="text-sm font-bold text-primary-600 hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>
          {inventoryItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inventoryItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">
                      ×{item.count}
                    </p>
                    <p className="text-xs text-neutral-500">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Chưa có vật phẩm nào.{" "}
              <Link
                href="/shop"
                className="text-primary-600 font-bold hover:underline"
              >
                Vào cửa hàng →
              </Link>
            </p>
          )}
        </div>

        <ProfileForm
          user={{
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl,
            level: user.level,
            xp: user.xp,
          }}
        />
      </main>
    </div>
  );
}

/**
 * Format ngày gia nhập theo locale vi-VN (dd/MM/yyyy).
 * Pure — tách ra để dễ test nếu sau này cần.
 */
function formatJoinDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
