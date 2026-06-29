import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/inventory");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      streakFreezes: true,
      unlockedIpaReveal: true,
      unlockedSlowAudio: true,
      xpBoostRemaining: true,
      hintTokens: true,
      secondChances: true,
      cosmetics: {
        select: { itemId: true, equipped: true, unlockedAt: true },
      },
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/inventory");
  }

  return <InventoryClient inventory={user} />;
}
