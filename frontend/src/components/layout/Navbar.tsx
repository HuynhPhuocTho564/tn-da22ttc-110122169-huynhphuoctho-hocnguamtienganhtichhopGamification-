import { auth } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";
import NavbarClient, { type NavbarLink } from "./NavbarClient";
import type { CosmeticFrame } from "@/components/ui/AvatarWithFrame";

const navLinks: Array<NavbarLink & { authOnly: boolean }> = [
  { href: "/dashboard", label: "Trang chủ", authOnly: true },
  { href: "/practice", label: "Bảng IPA", authOnly: true },
  { href: "/learning_map", label: "Lộ trình", authOnly: true },
  { href: "/missions", label: "Nhiệm vụ", authOnly: true },
  { href: "/shop", label: "Cửa hàng", authOnly: true },
  { href: "/inventory", label: "Kho vật phẩm", authOnly: true },
  { href: "/leaderboard", label: "Xếp hạng", authOnly: true },
  { href: "/badges", label: "Huy hiệu", authOnly: true },
];

export default async function Navbar() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);
  const isAdmin = session?.user?.role === "Admin";
  const username = session?.user?.name ?? "Người học";
  const avatarUrl = getAvatarUrl(username, session?.user?.image);

  // Fetch diamonds + equipped frame + purchased items for logged-in users
  let diamonds = 0;
  let equippedFrame: CosmeticFrame = null;
  let purchasedItemIds: string[] = [];
  if (session?.user?.id) {
    const [dbUser, cosmetic, userCosmetics] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          gems: true,
          unlockedIpaReveal: true,
          unlockedSlowAudio: true,
        },
      }),
      prisma.userCosmetic.findFirst({
        where: { userId: session.user.id, equipped: true },
        select: { itemId: true },
      }),
      prisma.userCosmetic.findMany({
        where: { userId: session.user.id },
        select: { itemId: true },
      }),
    ]);
    diamonds = dbUser?.gems ?? 0;
    equippedFrame = (cosmetic?.itemId as CosmeticFrame) ?? null;

    // Build purchased item IDs from UserCosmetic + permanent unlocks
    purchasedItemIds = userCosmetics.map((c) => c.itemId);
    if (dbUser?.unlockedIpaReveal) purchasedItemIds.push("ipa_reveal");
    if (dbUser?.unlockedSlowAudio) purchasedItemIds.push("slow_audio");
  }

  return (
    <NavbarClient
      links={navLinks.filter((link) => !link.authOnly || isAuthenticated)}
      user={isAuthenticated ? { username, avatarUrl, gems: diamonds, equippedFrame, purchasedItemIds } : null}
      isAdmin={isAdmin}
    />
  );
}
