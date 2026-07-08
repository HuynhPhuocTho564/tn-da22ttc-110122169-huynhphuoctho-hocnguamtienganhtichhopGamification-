/**
 * SEED LEADERBOARD - Thêm leaderboard entries cho user mới (deterministic)
 * Chạy: npx tsx prisma/seed_leaderboard.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function deterministicScore(seed: number): number {
  return ((seed * 9301 + 49297) % 233280);
}

async function main() {
  console.log("\n🏆 Seeding leaderboard entries for new users (deterministic)\n");

  const today = new Date();
  const weekKey = getWeekKey(today);

  const users = await prisma.user.findMany({
    where: { email: { contains: "@gmail.com" } },
    select: { id: true, username: true, xp: true },
    orderBy: { email: "asc" },
  });

  let created = 0;

  for (const user of users) {
    const hash = user.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const score = Math.floor(deterministicScore(hash) % 1500) + 100;
    const completedExercises = Math.floor(score / 15);
    const correctAnswers = Math.floor(completedExercises * 0.75);

    const existing = await prisma.leaderboard.findUnique({
      where: { userId_type_period: { userId: user.id, type: "tuan", period: weekKey } },
    });

    if (!existing) {
      await prisma.leaderboard.create({
        data: {
          userId: user.id,
          type: "tuan",
          period: weekKey,
          score,
          completedExercises,
          correctAnswers,
        },
      });
      console.log(`   ✓ ${user.username}: ${score} points (${completedExercises} exercises)`);
      created++;
    } else {
      await prisma.leaderboard.update({
        where: { id: existing.id },
        data: { score, completedExercises, correctAnswers },
      });
      console.log(`   ↻ ${user.username}: updated to ${score} points`);
      created++;
    }
  }

  const total = await prisma.leaderboard.count({ where: { type: "tuan", period: weekKey } });
  console.log(`\n✅ Done! ${created} entries for ${weekKey}, total: ${total}`);
}

main()
  .catch((err) => { console.error("❌ Error:", err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
