import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShopPageClient from "./ShopPageClient";

/** Cosmetic item IDs that use UserCosmetic model */
const COSMETIC_ITEM_IDS = ["frame_silver", "frame_gold", "frame_diamond", "frame_fire"];

/**
 * Shop page (server) — check auth + fetch gems + purchased items, render client component.
 *
 * Follows same pattern as dashboard/page.tsx.
 */
export default async function ShopPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/shop");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      gems: true,
      unlockedIpaReveal: true,
      unlockedSlowAudio: true,
      cosmetics: {
        select: { itemId: true },
      },
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/shop");
  }

  // Build purchased item IDs from UserCosmetic + permanent unlocks
  const purchasedItemIds: string[] = [];
  for (const cosmetic of user.cosmetics) {
    purchasedItemIds.push(cosmetic.itemId);
  }
  if (user.unlockedIpaReveal) purchasedItemIds.push("ipa_reveal");
  if (user.unlockedSlowAudio) purchasedItemIds.push("slow_audio");

  return <ShopPageClient initialGems={user.gems} purchasedItemIds={purchasedItemIds} />;
}
