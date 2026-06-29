/**
 * VERIFY EXPERT UNLOCK STATUS
 * 
 * Kiểm tra nhanh xem expert@pronunciation.app đã unlock đủ 4 topics chưa
 * 
 * Run: npx tsx prisma/verify_expert_unlock.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking unlock status for expert@pronunciation.app...\n");

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email: "expert@pronunciation.app" },
    select: { 
      id: true, 
      username: true, 
      email: true,
      level: true,
      xp: true,
      gems: true,
      streakCount: true,
    },
  });

  if (!user) {
    console.error("❌ User expert@pronunciation.app NOT FOUND!");
    console.log("\n💡 Solution:");
    console.log("   Run: npx tsx prisma\\seed_power_user.ts");
    process.exit(1);
  }

  console.log(`✅ User found: ${user.username}`);
  console.log(`   Level: ${user.level} | XP: ${user.xp} | Gems: ${user.gems} | Streak: ${user.streakCount}\n`);

  // 2. Get topics ordered by orderIndex (schema hiện tại không có Topic.status, Topic.order, Topic.maps — maps liên kết gián tiếp qua Exercise)
  const topics = await prisma.topic.findMany({
    select: { 
      id: true, 
      name: true,
      orderIndex: true,
    },
    orderBy: { orderIndex: "asc" },
  });

  // Lấy mapIds theo topicId thông qua Exercise (cầu nối duy nhất)
  const allExercises = await prisma.exercise.findMany({
    where: { status: "ACTIVE" },
    select: { topicId: true, mapId: true },
  });
  const mapIdsByTopic = new Map<string, string[]>();
  for (const ex of allExercises) {
    const arr = mapIdsByTopic.get(ex.topicId) ?? [];
    if (!arr.includes(ex.mapId)) arr.push(ex.mapId);
    mapIdsByTopic.set(ex.topicId, arr);
  }

  // Lấy progress theo user
  const allProgress = await prisma.progress.findMany({
    where: { userId: user.id },
    select: { mapId: true, position: true, result: true },
  });
  const progressByMapId = new Map<string, { position: number; result: string | null }>();
  for (const p of allProgress) {
    progressByMapId.set(p.mapId, { position: p.position ?? 0, result: p.result });
  }

  // Lấy tên map để log
  const allMaps = await prisma.learningMap.findMany({ select: { id: true, name: true } });
  const mapNameById = new Map(allMaps.map(m => [m.id, m.name]));

  console.log(`📚 Checking ${topics.length} topics...\n`);

  let allUnlocked = true;

  for (const topic of topics) {
    const topicMapIds: string[] = mapIdsByTopic.get(topic.id) ?? [];
    const totalMaps = topicMapIds.length;
    const completedMaps = topicMapIds.filter((mapId: string) => {
      const p = progressByMapId.get(mapId);
      return p?.result === "COMPLETED";
    }).length;

    const isUnlocked = completedMaps > 0 || topic.orderIndex === 1; // First topic always unlocked
    const completionRate = totalMaps > 0 ? Math.round((completedMaps / totalMaps) * 100) : 0;

    const icon = isUnlocked ? "🔓" : "🔒";
    const status = completionRate === 100 ? "✅ COMPLETED" : `${completionRate}%`;

    console.log(`${icon} ${topic.name} - ${status} (${completedMaps}/${totalMaps} maps)`);

    // Detail each map
    for (const mapId of topicMapIds) {
      const progress = progressByMapId.get(mapId);
      const mapName = mapNameById.get(mapId) ?? mapId;
      if (progress && progress.result === "COMPLETED") {
        console.log(`  ✓ ${mapName}: ${progress.position}% ${progress.result}`);
      } else if (progress) {
        console.log(`  ● ${mapName}: ${progress.position}% ${progress.result ?? "IN_PROGRESS"}`);
      } else {
        console.log(`  ○ ${mapName}: NOT STARTED`);
      }
    }

    console.log(); // Empty line

    if (!isUnlocked) allUnlocked = false;
  }

  // 3. Exercise completion
  const totalExercises = await prisma.exercise.count({
    where: { status: "ACTIVE" },
  });

  const completedExercises = await prisma.exerciseAttempt.count({
    where: { userId: user.id, status: "COMPLETED" },
  });

  const exerciseRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  console.log(`🎯 Exercise Completion: ${completedExercises}/${totalExercises} (${exerciseRate}%)\n`);

  // 4. Final verdict
  if (allUnlocked && exerciseRate === 100) {
    console.log("🎉 ================================");
    console.log("✅ ALL 4 TOPICS FULLY UNLOCKED!");
    console.log("🎉 ================================\n");
    console.log("Expert user can:");
    console.log("  ✓ Access all CD1 → CD2 → CD3 → CD4");
    console.log("  ✓ See 100% completion on dashboard");
    console.log("  ✓ View all learning maps");
    console.log("  ✓ Access all 112 exercises\n");
    console.log("🔑 Login: expert@pronunciation.app / Expert1234!");
    console.log("🌐 URL: http://localhost:3000");
  } else if (allUnlocked) {
    console.log("⚠️  Topics unlocked but exercises incomplete");
    console.log(`   Completed: ${exerciseRate}% (${completedExercises}/${totalExercises})`);
    console.log("\n💡 Re-run seed_power_user.ts to fix");
  } else {
    console.log("❌ SOME TOPICS LOCKED!");
    console.log("\n💡 Fix with:");
    console.log("   npx tsx prisma\\force_unlock_expert.ts");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
