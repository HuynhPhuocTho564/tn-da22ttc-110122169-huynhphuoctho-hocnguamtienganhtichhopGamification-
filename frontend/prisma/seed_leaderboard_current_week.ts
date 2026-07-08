/**
 * Seed Leaderboard entries for all existing users — current week period.
 *
 * Usage: npx tsx prisma/seed_leaderboard_current_week.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getWeekPeriod(date = new Date()): string {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function main() {
  const period = getWeekPeriod();
  console.log(`\n🏆 Seeding leaderboard for period: ${period}\n`);

  const users = await prisma.user.findMany({
    select: { id: true, username: true, xp: true, level: true, currentTier: true },
    orderBy: { xp: "desc" },
  });

  console.log(`   Found ${users.length} users\n`);

  let created = 0;
  for (const user of users) {
    // Score = XP * factor + random bonus (realistic spread)
    const baseScore = Math.floor(user.xp * 0.15);
    const randomBonus = Math.floor(Math.random() * 200);
    const score = Math.max(1, baseScore + randomBonus);
    const correctAnswers = Math.floor(score / 8);
    const completedExercises = Math.floor(score / 50);

    await prisma.leaderboard.upsert({
      where: { userId_type_period: { userId: user.id, type: "tuan", period } },
      update: {
        score,
        correctAnswers,
        completedExercises,
      },
      create: {
        userId: user.id,
        type: "tuan",
        period,
        score,
        correctAnswers,
        completedExercises,
      },
    });

    created++;
    console.log(`   ✓ ${user.username.padEnd(20)} | tier=${user.currentTier.padEnd(8)} | score=${score} | level=${user.level}`);
  }

  const total = await prisma.leaderboard.count({ where: { type: "tuan", period } });
  console.log(`\n✅ Done! Created ${created} entries. Total leaderboard rows for ${period}: ${total}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
