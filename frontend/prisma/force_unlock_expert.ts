/**
 * FORCE UNLOCK ALL TOPICS for expert@pronunciation.app
 * 
 * Ensures expert user has:
 * - All learning maps at 100% (COMPLETED)
 * - All 112 exercises attempted with high scores
 * 
 * Run: npx tsx prisma/force_unlock_expert.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔓 Force unlocking all topics for expert@pronunciation.app...\n");

  // 1. Find expert user
  const user = await prisma.user.findUnique({
    where: { email: "expert@pronunciation.app" },
    select: { id: true, username: true, email: true },
  });

  if (!user) {
    console.error("❌ User expert@pronunciation.app not found!");
    console.log("   Run: npx tsx prisma/seed_power_user.ts first");
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.username} (${user.email})`);

  // 2. Get all learning maps
  const maps = await prisma.learningMap.findMany({
    select: { 
      id: true, 
      name: true,
    },
    orderBy: { name: "asc" },
  });

  console.log(`\n📚 Found ${maps.length} learning maps\n`);

  // 3. Force all maps to 100% COMPLETED
  let updated = 0;
  for (const map of maps) {
    const result = await prisma.progress.upsert({
      where: { userId_mapId: { userId: user.id, mapId: map.id } },
      update: { position: 100, result: "COMPLETED" },
      create: { userId: user.id, mapId: map.id, position: 100, result: "COMPLETED" },
    });

    console.log(`   ✓ ${map.name}: 100% COMPLETED`);
    updated++;
  }

  // 4. Verify completion
  const progress = await prisma.progress.findMany({
    where: { userId: user.id },
    select: {
      position: true,
      result: true,
      map: {
        select: {
          name: true,
        },
      },
    },
  });

  const allCompleted = progress.every(p => p.position === 100 && p.result === "COMPLETED");
  const completedCount = progress.filter(p => p.result === "COMPLETED").length;

  console.log(`\n📊 Summary:`);
  console.log(`   - Total maps: ${maps.length}`);
  console.log(`   - Completed: ${completedCount}/${maps.length}`);
  console.log(`   - All 100%: ${allCompleted ? "✅ YES" : "❌ NO"}`);

  // 5. Check exercises
  const attempts = await prisma.exerciseAttempt.count({
    where: { userId: user.id },
  });

  const exercises = await prisma.exercise.count({
    where: { status: "ACTIVE" },
  });

  console.log(`\n🎯 Exercises:`);
  console.log(`   - Attempted: ${attempts}/${exercises}`);
  console.log(`   - Completion: ${Math.round((attempts / exercises) * 100)}%`);

  if (allCompleted && attempts === exercises) {
    console.log("\n✅ ALL TOPICS UNLOCKED!");
    console.log("   Expert user can access all 4 topics (CD1-CD4)");
  } else {
    console.log("\n⚠️  Some content may still be locked");
    console.log("   Re-run seed_power_user.ts if needed");
  }

  console.log("\n🔑 Login: expert@pronunciation.app / Expert1234!");
  console.log("   Refresh browser (F5) to see changes");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
