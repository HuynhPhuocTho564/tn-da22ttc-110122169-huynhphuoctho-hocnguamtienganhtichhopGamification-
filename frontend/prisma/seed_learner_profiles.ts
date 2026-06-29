/**
 * SEED LEARNER PROFILES — Tạo users + gamification data cho leaderboard / admin dashboard.
 *
 * Gồm:
 * - 6 beginner learners (XP/level/streak/gems realistic + attempts + daily activity)
 * - 8 intermediate learners (tier system)
 * - 5 top learners (champion / star / rising / pro / newbie)
 *
 * Idempotent: upsert theo email.
 *
 * Chạy: npx tsx prisma/seed_learner_profiles.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getWeekPeriod, getMonthPeriod } from "../src/lib/period";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "abc@123456";

// ─── User definitions ────────────────────────────────────────

type LearnerProfile = {
  email: string;
  username: string;
  xp: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  totalCheckIns: number;
  daysAgoCreated: number;
  gems: number;
  streakFreezes: number;
  tier: string;
  correctAnswers?: number;
  completedExercises?: number;
};

// 6 beginner learners — data lấy từ file seed beginner cũ (richer hơn: có streakFreezes, longestStreak, totalCheckIns, daysAgoCreated)
const BEGINNER_LEARNERS: LearnerProfile[] = [
  { username: "minh_nguyen", email: "minh@gmail.com", xp: 2450, level: 3, streakCount: 12, longestStreak: 15, totalCheckIns: 18, daysAgoCreated: 20, gems: 15, streakFreezes: 1, tier: "bronze" },
  { username: "lan_tran", email: "lan@gmail.com", xp: 1820, level: 2, streakCount: 7, longestStreak: 9, totalCheckIns: 11, daysAgoCreated: 15, gems: 10, streakFreezes: 0, tier: "bronze" },
  { username: "hoang_le", email: "hoang@gmail.com", xp: 3200, level: 4, streakCount: 21, longestStreak: 25, totalCheckIns: 30, daysAgoCreated: 30, gems: 25, streakFreezes: 2, tier: "bronze" },
  { username: "mai_pham", email: "mai@gmail.com", xp: 980, level: 2, streakCount: 3, longestStreak: 5, totalCheckIns: 6, daysAgoCreated: 8, gems: 5, streakFreezes: 0, tier: "bronze" },
  { username: "duc_vo", email: "duc@gmail.com", xp: 4100, level: 5, streakCount: 35, longestStreak: 40, totalCheckIns: 45, daysAgoCreated: 45, gems: 40, streakFreezes: 3, tier: "bronze" },
  { username: "anh_phan", email: "anh@gmail.com", xp: 560, level: 1, streakCount: 1, longestStreak: 2, totalCheckIns: 2, daysAgoCreated: 3, gems: 0, streakFreezes: 0, tier: "bronze" },
];

// 8 intermediate learners — lấy từ seed_league_users.ts NEW_USERS (giữ streak gốc làm longestStreak)
const INTERMEDIATE_LEARNERS: LearnerProfile[] = [
  { email: "tuan@gmail.com", username: "tuan_le", xp: 350, level: 2, streakCount: 8, longestStreak: 8, totalCheckIns: 0, daysAgoCreated: 0, gems: 25, streakFreezes: 0, tier: "bronze" },
  { email: "hoa@gmail.com", username: "hoa_nguyen", xp: 280, level: 2, streakCount: 6, longestStreak: 6, totalCheckIns: 0, daysAgoCreated: 0, gems: 20, streakFreezes: 0, tier: "bronze" },
  { email: "kien@gmail.com", username: "kien_trong", xp: 420, level: 3, streakCount: 12, longestStreak: 12, totalCheckIns: 0, daysAgoCreated: 0, gems: 40, streakFreezes: 0, tier: "silver" },
  { email: "ngoc@gmail.com", username: "ngoc_dang", xp: 190, level: 2, streakCount: 4, longestStreak: 4, totalCheckIns: 0, daysAgoCreated: 0, gems: 12, streakFreezes: 0, tier: "bronze" },
  { email: "phu@gmail.com", username: "phu_huynh", xp: 90, level: 1, streakCount: 2, longestStreak: 2, totalCheckIns: 0, daysAgoCreated: 0, gems: 5, streakFreezes: 0, tier: "bronze" },
  { email: "tram@gmail.com", username: "tram_bui", xp: 310, level: 2, streakCount: 7, longestStreak: 7, totalCheckIns: 0, daysAgoCreated: 0, gems: 22, streakFreezes: 0, tier: "bronze" },
  { email: "viet@gmail.com", username: "viet_dang", xp: 160, level: 2, streakCount: 3, longestStreak: 3, totalCheckIns: 0, daysAgoCreated: 0, gems: 8, streakFreezes: 0, tier: "bronze" },
  { email: "thao@gmail.com", username: "thao_nguyen", xp: 250, level: 2, streakCount: 5, longestStreak: 5, totalCheckIns: 0, daysAgoCreated: 0, gems: 18, streakFreezes: 0, tier: "bronze" },
];

// 5 top learners — lấy từ seed_league_users.ts TOP_USERS (có sẵn correctAnswers, completedExercises)
const TOP_LEARNERS: LearnerProfile[] = [
  { email: "champion@gmail.com", username: "champion_kid", xp: 2500, level: 6, streakCount: 30, longestStreak: 30, totalCheckIns: 0, daysAgoCreated: 0, gems: 150, streakFreezes: 0, tier: "diamond", correctAnswers: 250, completedExercises: 45 },
  { email: "star@gmail.com", username: "star_learner", xp: 1800, level: 5, streakCount: 21, longestStreak: 21, totalCheckIns: 0, daysAgoCreated: 0, gems: 100, streakFreezes: 0, tier: "gold", correctAnswers: 180, completedExercises: 35 },
  { email: "rising@gmail.com", username: "rising_star", xp: 1200, level: 4, streakCount: 14, longestStreak: 14, totalCheckIns: 0, daysAgoCreated: 0, gems: 70, streakFreezes: 0, tier: "gold", correctAnswers: 120, completedExercises: 25 },
  { email: "pro@gmail.com", username: "pro_player", xp: 900, level: 4, streakCount: 10, longestStreak: 10, totalCheckIns: 0, daysAgoCreated: 0, gems: 50, streakFreezes: 0, tier: "silver", correctAnswers: 90, completedExercises: 20 },
  { email: "newbie@gmail.com", username: "newbie_pro", xp: 300, level: 2, streakCount: 5, longestStreak: 5, totalCheckIns: 0, daysAgoCreated: 0, gems: 15, streakFreezes: 0, tier: "bronze", correctAnswers: 30, completedExercises: 8 },
];

const ALL_LEARNERS = [...BEGINNER_LEARNERS, ...INTERMEDIATE_LEARNERS, ...TOP_LEARNERS];

// ─── Seed function ───────────────────────────────────────────

async function main() {
  console.log("👥 Seeding learner profiles (19 users)...\n");

  // Chỉ tạo User role — Admin role do bootstrap_admin.ts quản lý riêng.
  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: { name: "User" },
  });

  // Lấy exercises ACTIVE để gán attempts (chỉ dùng cho beginner learners).
  const exercises = await prisma.exercise.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    take: 20,
  });
  console.log(`   Found ${exercises.length} ACTIVE exercises for attempt generation`);

  if (exercises.length === 0) {
    console.warn("   ⚠️  No ACTIVE exercises found. Run seed_lessons first. Skipping attempts.");
  }

  const now = new Date();
  const weekPeriod = getWeekPeriod(now);
  const monthPeriod = getMonthPeriod(now);

  let beginnerCount = 0;
  let intermediateCount = 0;
  let topCount = 0;

  for (const learner of ALL_LEARNERS) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - learner.daysAgoCreated);

    // lastCheckInDate chỉ set cho beginner learners (giữ logic gốc từ file seed beginner cũ).
    // Intermediate + top không set (giữ logic gốc từ file seed league cũ — set lastLoginDate khi create).
    const lastCheckIn = learner.daysAgoCreated > 0
      ? (() => {
          const d = new Date(now);
          d.setDate(d.getDate() - 1);
          return d;
        })()
      : null;

    const isBeginner = BEGINNER_LEARNERS.includes(learner);

    const user = await prisma.user.upsert({
      where: { email: learner.email },
      update: {
        passwordHash,
        xp: learner.xp,
        level: learner.level,
        streakCount: learner.streakCount,
        longestStreak: learner.longestStreak,
        totalCheckIns: learner.totalCheckIns,
        gems: learner.gems,
        streakFreezes: learner.streakFreezes,
        currentTier: learner.tier,
        status: "ACTIVE",
        roleId: userRole.id,
        ...(isBeginner ? { lastCheckInDate: lastCheckIn } : {}),
      },
      create: {
        username: learner.username,
        email: learner.email,
        passwordHash,
        xp: learner.xp,
        level: learner.level,
        streakCount: learner.streakCount,
        longestStreak: learner.longestStreak,
        totalCheckIns: learner.totalCheckIns,
        gems: learner.gems,
        streakFreezes: learner.streakFreezes,
        currentTier: learner.tier,
        status: "ACTIVE",
        roleId: userRole.id,
        createdAt,
        ...(isBeginner ? { lastCheckInDate: lastCheckIn } : { lastLoginDate: new Date() }),
      },
      select: { id: true, username: true, xp: true, level: true },
    });

    if (isBeginner) {
      beginnerCount++;
      console.log(`   ✓ [beginner] ${user.username} | xp=${user.xp} | level=${user.level}`);

      // Leaderboard tuần + tháng (giữ logic gốc từ file seed beginner cũ: score = xp)
      for (const [type, period] of [["tuan", weekPeriod], ["thang", monthPeriod]] as const) {
        await prisma.leaderboard.upsert({
          where: { userId_type_period: { userId: user.id, type, period } },
          update: {
            score: learner.xp,
            correctAnswers: Math.floor(learner.xp / 10),
            completedExercises: Math.floor(learner.xp / 100),
          },
          create: {
            userId: user.id,
            type,
            period,
            score: learner.xp,
            correctAnswers: Math.floor(learner.xp / 10),
            completedExercises: Math.floor(learner.xp / 100),
          },
        });
      }

      // Exercise attempts — gán 3-5 attempt ngẫu nhiên với score 60-95
      if (exercises.length > 0) {
        const numAttempts = Math.min(5, Math.max(3, Math.floor(learner.xp / 800)));
        for (let i = 0; i < numAttempts; i++) {
          const ex = exercises[(i + learner.username.length) % exercises.length];
          const score = 60 + Math.floor(Math.random() * 36); // 60-95
          const attemptDate = new Date(now);
          attemptDate.setDate(attemptDate.getDate() - Math.floor(Math.random() * 7)); // trong 7 ngày qua
          await prisma.exerciseAttempt.create({
            data: {
              userId: user.id,
              exerciseId: ex.id,
              status: "COMPLETED",
              attemptCount: 1 + Math.floor(Math.random() * 3),
              score,
              createdAt: attemptDate,
            },
          });
        }
      }

      // Daily activity hôm nay (xpEarned = xp/10, completedExercises = random)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      await prisma.dailyActivity.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        create: {
          userId: user.id,
          date: today,
          xpEarned: Math.floor(learner.xp / 10),
          completedExercises: Math.floor(Math.random() * 4),
          checkIns: 0,
        },
        update: {},
      });
    } else if (INTERMEDIATE_LEARNERS.includes(learner)) {
      intermediateCount++;
      console.log(`   ✓ [intermediate] ${user.username} | tier=${learner.tier} | xp=${user.xp}`);

      // Weekly leaderboard — giữ logic gốc từ seed_league_users.ts: Math.floor(xp * 0.3) + correctAnswers * 5
      const weeklyScore = Math.floor(learner.xp * 0.3) + (learner.correctAnswers ?? 0) * 5;
      await prisma.leaderboard.upsert({
        where: { userId_type_period: { userId: user.id, type: "tuan", period: weekPeriod } },
        update: {
          score: weeklyScore,
          correctAnswers: learner.correctAnswers ?? 0,
          completedExercises: learner.completedExercises ?? 0,
        },
        create: {
          userId: user.id,
          type: "tuan",
          period: weekPeriod,
          score: weeklyScore,
          correctAnswers: learner.correctAnswers ?? 0,
          completedExercises: learner.completedExercises ?? 0,
        },
      });
    } else {
      // TOP_LEARNERS
      topCount++;
      console.log(`   ✓ [top] ${user.username} | tier=${learner.tier} | xp=${user.xp}`);

      const weeklyScore = Math.floor(learner.xp * 0.3) + (learner.correctAnswers ?? 0) * 5;
      await prisma.leaderboard.upsert({
        where: { userId_type_period: { userId: user.id, type: "tuan", period: weekPeriod } },
        update: {
          score: weeklyScore,
          correctAnswers: learner.correctAnswers ?? 0,
          completedExercises: learner.completedExercises ?? 0,
        },
        create: {
          userId: user.id,
          type: "tuan",
          period: weekPeriod,
          score: weeklyScore,
          correctAnswers: learner.correctAnswers ?? 0,
          completedExercises: learner.completedExercises ?? 0,
        },
      });
    }
  }

  const totalUsers = await prisma.user.count();
  const totalAttempts = await prisma.exerciseAttempt.count();
  const totalLeaderboard = await prisma.leaderboard.count();
  console.log(`\n📊 Summary:`);
  console.log(`   Beginner learners: ${beginnerCount}`);
  console.log(`   Intermediate learners: ${intermediateCount}`);
  console.log(`   Top learners: ${topCount}`);
  console.log(`   Total users in DB: ${totalUsers}`);
  console.log(`   Exercise attempts in DB: ${totalAttempts}`);
  console.log(`   Leaderboard entries in DB: ${totalLeaderboard}`);
  console.log(`\n✅ Learner profiles seeded successfully.`);
  console.log(`   Login learner: minh@gmail.com (hoặc lan/hoang/mai/duc/anh) / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding learner profiles:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
