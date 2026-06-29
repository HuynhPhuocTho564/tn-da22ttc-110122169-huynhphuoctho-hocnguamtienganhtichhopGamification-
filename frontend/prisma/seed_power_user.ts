/**
 * SEED POWER USER - Tạo 1 user demo đã hoàn thành tất cả 4 chủ đề (CD1-CD4)
 * với dữ liệu realistic để demo progress tracking + gamification đầy đủ.
 *
 * User này:
 * - Hoàn thành 112/112 exercises (100%)
 * - Unlock tất cả 4 topics
 * - Level cao (8-10)
 * - XP/Gems/Streak cao
 * - Nhiều badges
 * - Top leaderboard
 *
 * Chạy: npx tsx prisma/seed_power_user.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getWeekPeriod, getMonthPeriod } from "../src/lib/period";

const prisma = new PrismaClient();

const POWER_USER = {
  username: "expert_learner",
  email: "expert@pronunciation.app",
  password: "Expert1234!",
  xp: 8500, // Level ~9 (sqrt(8500/100) + 1 ≈ 10)
  gems: 150,
  streakCount: 45,
  longestStreak: 50,
  totalCheckIns: 60,
  streakFreezes: 5,
  daysAgoCreated: 60, // 2 tháng trước
};

async function main() {
  console.log("🚀 Seeding power user (expert_learner)...\n");

  // 1. Ensure User role exists
  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: { name: "User" },
  });

  // 2. Get all exercises (should be 112 if catalog v2 seeded)
  const exercises = await prisma.exercise.findMany({
    where: { status: "ACTIVE" },
    select: { 
      id: true, 
      name: true,
      topic: { select: { id: true, name: true } },
      map: { select: { id: true, name: true } },
    },
    orderBy: [
      { topic: { name: "asc" } },
      { map: { name: "asc" } },
    ],
  });

  console.log(`   📚 Found ${exercises.length} exercises`);

  if (exercises.length === 0) {
    console.error("   ❌ No exercises found. Run seed_lessons first.");
    process.exit(1);
  }

  // 3. Create power user
  const now = new Date();
  const createdAt = new Date(now);
  createdAt.setDate(createdAt.getDate() - POWER_USER.daysAgoCreated);
  
  const lastCheckIn = new Date(now);
  lastCheckIn.setDate(lastCheckIn.getDate() - 1); // Yesterday

  const passwordHash = await bcrypt.hash(POWER_USER.password, 10);

  const user = await prisma.user.upsert({
    where: { email: POWER_USER.email },
    update: {
      passwordHash,
      xp: POWER_USER.xp,
      level: Math.floor(Math.sqrt(POWER_USER.xp / 100)) + 1,
      streakCount: POWER_USER.streakCount,
      longestStreak: POWER_USER.longestStreak,
      totalCheckIns: POWER_USER.totalCheckIns,
      lastCheckInDate: lastCheckIn,
      gems: POWER_USER.gems,
      streakFreezes: POWER_USER.streakFreezes,
      status: "ACTIVE",
      roleId: userRole.id,
    },
    create: {
      username: POWER_USER.username,
      email: POWER_USER.email,
      passwordHash,
      xp: POWER_USER.xp,
      level: Math.floor(Math.sqrt(POWER_USER.xp / 100)) + 1,
      streakCount: POWER_USER.streakCount,
      longestStreak: POWER_USER.longestStreak,
      totalCheckIns: POWER_USER.totalCheckIns,
      lastCheckInDate: lastCheckIn,
      gems: POWER_USER.gems,
      streakFreezes: POWER_USER.streakFreezes,
      status: "ACTIVE",
      roleId: userRole.id,
      createdAt,
    },
    select: { id: true, username: true, email: true, xp: true, level: true },
  });

  console.log(`   ✓ User created: ${user.username} | Level ${user.level} | ${user.xp} XP | ${POWER_USER.gems} gems`);

  // 4. Create exercise attempts (ALL exercises with realistic scores 70-98)
  console.log(`\n   📝 Creating ${exercises.length} exercise attempts...`);
  
  let attemptCount = 0;
  const startDate = new Date(createdAt);
  startDate.setDate(startDate.getDate() + 5); // Start 5 days after registration

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    
    // Score progression: earlier exercises = lower, later = higher
    const progressFactor = i / exercises.length; // 0 to 1
    const baseScore = 70 + Math.floor(progressFactor * 20); // 70-90
    const randomBonus = Math.floor(Math.random() * 8); // 0-8
    const score = Math.min(98, baseScore + randomBonus); // Max 98 (realistic)

    // Attempt date: distributed over 60 days
    const attemptDate = new Date(startDate);
    attemptDate.setDate(attemptDate.getDate() + Math.floor((i / exercises.length) * 55));

    // Retry count: earlier exercises more retries
    const retryCount = progressFactor < 0.3 ? 2 + Math.floor(Math.random() * 2) : 1;

    await prisma.exerciseAttempt.create({
      data: {
        userId: user.id,
        exerciseId: exercise.id,
        status: "COMPLETED",
        attemptCount: retryCount,
        score,
        createdAt: attemptDate,
      },
    });

    attemptCount++;
    if ((i + 1) % 20 === 0) {
      console.log(`      ... ${i + 1}/${exercises.length} attempts created`);
    }
  }

  console.log(`   ✓ ${attemptCount} exercise attempts created\n`);

  // 5. Create learning map progress (ALL maps completed)
  const learningMaps = await prisma.learningMap.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  console.log(`   🗺️  Creating progress for ${learningMaps.length} learning maps...`);
  
  for (const map of learningMaps) {
    await prisma.progress.upsert({
      where: { userId_mapId: { userId: user.id, mapId: map.id } },
      update: { position: 100, result: "COMPLETED" },
      create: { userId: user.id, mapId: map.id, position: 100, result: "COMPLETED" },
    });
  }

  console.log(`   ✓ All maps completed\n`);

  // 6. Create leaderboard entries (top position)
  const weekPeriod = getWeekPeriod(now);
  const monthPeriod = getMonthPeriod(now);

  for (const [type, period] of [["tuan", weekPeriod], ["thang", monthPeriod]] as const) {
    await prisma.leaderboard.upsert({
      where: { userId_type_period: { userId: user.id, type, period } },
      update: { 
        score: POWER_USER.xp, 
        correctAnswers: Math.floor(POWER_USER.xp / 8), 
        completedExercises: exercises.length 
      },
      create: { 
        userId: user.id, 
        type, 
        period, 
        score: POWER_USER.xp, 
        correctAnswers: Math.floor(POWER_USER.xp / 8), 
        completedExercises: exercises.length 
      },
    });
  }

  console.log(`   ✓ Leaderboard entries created (tuần + tháng)\n`);

  // 7. Create daily activity for last 7 days
  console.log(`   📅 Creating daily activity for last 7 days...`);
  
  for (let i = 0; i < 7; i++) {
    const activityDate = new Date(now);
    activityDate.setDate(activityDate.getDate() - i);
    const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

    await prisma.dailyActivity.upsert({
      where: { userId_date: { userId: user.id, date: activityDay } },
      create: { 
        userId: user.id, 
        date: activityDay, 
        xpEarned: 80 + Math.floor(Math.random() * 40), // 80-120 XP/day
        completedExercises: 2 + Math.floor(Math.random() * 3), // 2-4 exercises/day
        checkIns: i === 0 ? 1 : 0 // Check-in today
      },
      update: {},
    });
  }

  console.log(`   ✓ Daily activity created\n`);

  // 8. Summary
  const totalProgress = await prisma.progress.count({ where: { userId: user.id } });
  const totalAttempts = await prisma.exerciseAttempt.count({ where: { userId: user.id } });
  const totalLeaderboards = await prisma.leaderboard.count({ where: { userId: user.id } });

  console.log("📊 Summary:");
  console.log(`   - User: ${user.username} (${user.email})`);
  console.log(`   - Level: ${user.level} | XP: ${user.xp} | Gems: ${POWER_USER.gems}`);
  console.log(`   - Streak: ${POWER_USER.streakCount} days (longest: ${POWER_USER.longestStreak})`);
  console.log(`   - Progress: ${totalProgress}/${learningMaps.length} maps completed`);
  console.log(`   - Attempts: ${totalAttempts}/${exercises.length} exercises completed`);
  console.log(`   - Leaderboard: ${totalLeaderboards} entries`);

  console.log("\n✅ Power user created successfully!");
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Email: ${POWER_USER.email}`);
  console.log(`   Password: ${POWER_USER.password}`);
  console.log(`\n💡 This user has:`);
  console.log(`   ✓ Completed ALL 112 exercises (100%)`);
  console.log(`   ✓ Unlocked ALL 4 topics (CD1-CD4)`);
  console.log(`   ✓ High level (~9-10) with ${POWER_USER.xp} XP`);
  console.log(`   ✓ ${POWER_USER.gems} gems for shopping`);
  console.log(`   ✓ ${POWER_USER.streakCount}-day streak`);
  console.log(`   ✓ Top leaderboard position`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding power user:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
