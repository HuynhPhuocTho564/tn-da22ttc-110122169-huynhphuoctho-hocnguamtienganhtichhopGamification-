/**
 * GRANT DEMO COMPLETION — Cấp completion 100% cho user demo hiện có.
 *
 * Dùng để demo trạng thái "đã hoàn thành tất cả" cho user cụ thể:
 * - Tạo ExerciseAttempt với score=95 (>= 90 = mastery, >= 60 = completion)
 * - Đảm bảo Progress cho MỌI LearningMap (position=100, result=COMPLETED)
 * - Update User XP/level/gems/streakCount/longestStreak cao
 * - Unlock TẤT CẢ 4 đảo (điều kiện unlock CĐ2/3/4 = 100% prereq — code dùng count-based
 *   ở src/app/learning_map/page.tsx:147)
 *
 * KHÔNG tạo user mới — chỉ cập nhật user đã tồn tại (xác định qua email).
 *
 * Cách chạy (trên máy Windows — Prisma client đã generated cho windows):
 *   cd english_pronunciation_app/frontend
 *   npx tsx prisma/grant_demo_completion.ts ptho3020@gmail.com
 *
 * Idempotent: chạy nhiều lần vẫn an toàn (ExerciseAttempt không có unique constraint
 * trên userId+exerciseId; Progress dùng upsert theo @@unique([userId, mapId])).
 */

import { PrismaClient } from "@prisma/client";
import { getWeekPeriod, getMonthPeriod } from "../src/lib/period";

const prisma = new PrismaClient();

// ─── Constants (giữ magic numbers ra khỏi logic — skill maintainable-code) ───
const DEMO_TARGET_SCORE = 95;
const DEMO_XP = 10000;
const DEMO_GEMS = 250;
const DEMO_STREAK = 30;
const DEMO_LONGEST_STREAK = 45;
const DEMO_TOTAL_CHECKINS = 50;
const DEMO_PROGRESS_POSITION = 100;
const DEMO_PROGRESS_RESULT = "COMPLETED";
const PROGRESS_LOG_EVERY = 20;
const MAX_PROGRESS_PERCENT = 100;

function emailFromArg(): string {
  const email = process.argv[2];
  if (!email) {
    console.error("❌ Thiếu email. Cách dùng: npx tsx prisma/grant_demo_completion.ts <email>");
    process.exit(1);
  }
  return email;
}

/** Level từ XP theo công thức trong codebase (xem src/app/dashboard/page.tsx:96-97). */
function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

async function findOrThrowUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, email: true, roleId: true },
  });
  if (!user) {
    console.error(`❌ Không tìm thấy user với email "${email}". Tạo user trước rồi chạy lại.`);
    process.exit(1);
  }
  return user;
}

async function upsertUserStats(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      xp: DEMO_XP,
      level: levelFromXp(DEMO_XP),
      gems: DEMO_GEMS,
      streakCount: DEMO_STREAK,
      longestStreak: DEMO_LONGEST_STREAK,
      totalCheckIns: DEMO_TOTAL_CHECKINS,
      status: "ACTIVE",
    },
    select: { id: true, username: true, xp: true, level: true, gems: true },
  });
}

async function createAttemptsForAllExercises(userId: string) {
  const exercises = await prisma.exercise.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  if (exercises.length === 0) {
    throw new Error("Không có exercise ACTIVE nào. Chạy seed_lessons trước.");
  }

  const now = new Date();
  let count = 0;
  for (const exercise of exercises) {
    await prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseId: exercise.id,
        status: "COMPLETED",
        attemptCount: 1,
        score: DEMO_TARGET_SCORE,
        createdAt: now,
      },
    });
    count += 1;
    if (count % PROGRESS_LOG_EVERY === 0) {
      console.log(`      ... ${count}/${exercises.length} attempts`);
    }
  }
  return { count, total: exercises.length };
}

async function upsertProgressForAllMaps(userId: string) {
  const maps = await prisma.learningMap.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  for (const map of maps) {
    await prisma.progress.upsert({
      where: { userId_mapId: { userId, mapId: map.id } },
      update: { position: DEMO_PROGRESS_POSITION, result: DEMO_PROGRESS_RESULT },
      create: {
        userId,
        mapId: map.id,
        position: DEMO_PROGRESS_POSITION,
        result: DEMO_PROGRESS_RESULT,
      },
    });
  }
  return maps.length;
}

async function upsertLeaderboardEntries(userId: string) {
  const now = new Date();
  const weekPeriod = getWeekPeriod(now);
  const monthPeriod = getMonthPeriod(now);
  const periods: Array<["tuan" | "thang", string]> = [
    ["tuan", weekPeriod],
    ["thang", monthPeriod],
  ];
  for (const [type, period] of periods) {
    await prisma.leaderboard.upsert({
      where: { userId_type_period: { userId, type, period } },
      update: { score: DEMO_XP, completedExercises: 1, correctAnswers: 0 },
      create: {
        userId,
        type,
        period,
        score: DEMO_XP,
        completedExercises: 1,
        correctAnswers: 0,
      },
    });
  }
}

function clampPercent(value: number): number {
  return Math.min(MAX_PROGRESS_PERCENT, Math.max(0, Math.round(value)));
}

async function verifyAndReport(userId: string, attemptsCreated: number) {
  const [user, exerciseCount, attemptCount, progressCount, attemptsAt90] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, xp: true, level: true, gems: true, streakCount: true },
    }),
    prisma.exercise.count({ where: { status: "ACTIVE" } }),
    prisma.exerciseAttempt.count({ where: { userId } }),
    prisma.progress.count({ where: { userId } }),
    prisma.exerciseAttempt.findMany({
      where: { userId, score: { gte: 90 } },
      distinct: ["exerciseId"],
      select: { exerciseId: true },
    }),
  ]);

  if (!user) throw new Error("User vừa cập nhật không tìm thấy — lỗi không mong đợi.");

  console.log("\n✅ HOÀN THÀNH");
  console.log(`   User:           ${user.username} (${userId})`);
  console.log(`   Level / XP:     ${user.level} / ${user.xp}`);
  console.log(`   Gems / Streak:  ${user.gems} / ${user.streakCount}`);
  console.log(`   Attempts:       ${attemptCount} (mới tạo: ${attemptsCreated})`);
  console.log(`   Progress rows:  ${progressCount}`);
  console.log(
    `   Mastery (>=90): ${attemptsAt90.length}/${exerciseCount} bài đạt 3 sao`,
  );

  const completionPercent = clampPercent((attemptsAt90.length / Math.max(exerciseCount, 1)) * 100);
  console.log(`   Completion %:   ${completionPercent}%`);
  console.log(
    `\n   💡 Unlock CĐ2/3/4 yêu cầu 100% prereq (count-based) — đảm bảo đã pass bằng cách set Progress.position=100 cho mọi map.`,
  );
}

async function main() {
  const email = emailFromArg();
  console.log(`🚀 Granting demo completion for: ${email}\n`);

  const user = await findOrThrowUser(email);
  console.log(`   ✓ User found: ${user.username} (id=${user.id})`);

  const updatedUser = await upsertUserStats(user.id);
  console.log(`   ✓ Stats updated: Level ${updatedUser.level} | ${updatedUser.xp} XP | ${updatedUser.gems} gems`);

  console.log("\n   📝 Creating exercise attempts...");
  const { count: attemptsCreated, total } = await createAttemptsForAllExercises(user.id);
  console.log(`   ✓ ${attemptsCreated}/${total} attempts created (score=${DEMO_TARGET_SCORE})`);

  console.log("\n   🗺️  Creating learning map progress...");
  const mapCount = await upsertProgressForAllMaps(user.id);
  console.log(`   ✓ ${mapCount} maps marked COMPLETED`);

  console.log("\n   🏆 Creating leaderboard entries...");
  await upsertLeaderboardEntries(user.id);
  console.log(`   ✓ Leaderboard entries upserted (week + month)`);

  await verifyAndReport(user.id, attemptsCreated);
}

main()
  .catch((err) => {
    console.error("❌ Lỗi:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
