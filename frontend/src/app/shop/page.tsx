import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ShopPageClient from "./ShopPageClient";

/**
 * Shop page (server) — check auth + fetch gems, render client component.
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
    select: { gems: true },
  });

  if (!user) {
    redirect("/login?callbackUrl=/shop");
  }

  return <ShopPageClient initialGems={user.gems} />;
}
