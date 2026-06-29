/**
 * Seed Milestone Rewards for Gamification Engagement Phase 2.
 *
 * Run: npx tsx prisma/seed-milestones.ts
 *
 * Creates milestone rewards at key levels with gems + badges.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MILESTONES = [
  {
    level: 5,
    gemsReward: 50,
    badgeName: "milestone_starter",
    title: "Khởi Đầu",
    description: "Bước đầu trên hành trình phát âm tiếng Anh",
  },
  {
    level: 10,
    gemsReward: 100,
    badgeName: "milestone_persistent",
    title: "Kiên Trì",
    description: "10 cấp độ kiên trì luyện tập",
  },
  {
    level: 15,
    gemsReward: 100,
    badgeName: "milestone_explorer",
    title: "Khám Phá",
    description: "Đã khám phá nhiều chủ đề phát âm",
  },
  {
    level: 20,
    gemsReward: 200,
    badgeName: "milestone_master",
    title: "Bậc Thầy",
    description: "Thành thạo phát âm tiếng Anh ở mức cao",
  },
  {
    level: 30,
    gemsReward: 300,
    badgeName: "milestone_legend",
    title: "Huyền Thoại",
    description: "Cấp độ thần thoại — bạn là nguồn cảm hứng!",
  },
];

async function main() {
  console.log("🌱 Seeding milestone rewards...");

  for (const m of MILESTONES) {
    const result = await prisma.milestoneReward.upsert({
      where: { level: m.level },
      update: {
        gemsReward: m.gemsReward,
        badgeName: m.badgeName,
        title: m.title,
        description: m.description,
      },
      create: {
        level: m.level,
        gemsReward: m.gemsReward,
        badgeName: m.badgeName,
        title: m.title,
        description: m.description,
      },
    });
    console.log(`  ✅ Level ${result.level}: "${result.title}" (${result.gemsReward} gems)`);
  }

  console.log(`\n✨ Done! ${MILESTONES.length} milestones seeded.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
