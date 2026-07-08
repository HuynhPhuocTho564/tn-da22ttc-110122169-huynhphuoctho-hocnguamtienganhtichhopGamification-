import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const words = ["caterpillar", "bee", "fish", "shrimp", "cat", "fox", "lizard", "snake"];
  for (const w of words) {
    const items = await prisma.wordItem.findMany({
      where: { word: w },
      select: { id: true, status: true, audioUrl: true, phonemeId: true },
    });
    const active = items.filter((i) => i.status === "ACTIVE" && i.audioUrl);
    const bad = items.filter((i) => i.status !== "ACTIVE" || !i.audioUrl);
    if (bad.length > 0 && active.length > 0) {
      for (const b of bad) {
        await prisma.wordItem.delete({ where: { id: b.id } });
        console.log(`Deleted NEEDS_REVIEW: ${w} (${b.id})`);
      }
    }
  }
  console.log("Cleanup done");
  process.exit(0);
}

main();
