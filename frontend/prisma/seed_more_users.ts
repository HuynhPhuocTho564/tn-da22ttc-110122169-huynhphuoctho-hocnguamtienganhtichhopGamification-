/**
 * SEED MORE USERS - Tạo 15 user mới với @gmail.com
 * Chạy: npx tsx prisma/seed_more_users.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();
const USER_ROLE_ID = "78d102b2-afa4-410a-9dfb-00879b960ae5";
const DEFAULT_PASSWORD_HASH = hashSync("123456", 10);

const NEW_USERS = [
  { username: "nguyen_van_a", email: "nguyenvana@gmail.com", xp: 450, level: 2, gems: 35, streakCount: 8, longestStreak: 12, totalCheckIns: 15, currentTier: "bronze", gender: "male" },
  { username: "tran_thi_b", email: "tranthib@gmail.com", xp: 720, level: 3, gems: 55, streakCount: 12, longestStreak: 18, totalCheckIns: 25, currentTier: "silver", gender: "female" },
  { username: "le_minh_c", email: "leminhc@gmail.com", xp: 1500, level: 4, gems: 120, streakCount: 20, longestStreak: 25, totalCheckIns: 40, currentTier: "gold", gender: "male" },
  { username: "pham_hong_d", email: "phamhongd@gmail.com", xp: 350, level: 2, gems: 20, streakCount: 5, longestStreak: 8, totalCheckIns: 10, currentTier: "bronze", gender: "female" },
  { username: "hoang_viet_e", email: "hoangviete@gmail.com", xp: 2200, level: 5, gems: 180, streakCount: 28, longestStreak: 35, totalCheckIns: 50, currentTier: "diamond", gender: "male" },
  { username: "nguyen_thuy_f", email: "nguyenthuyf@gmail.com", xp: 85, level: 1, gems: 3, streakCount: 1, longestStreak: 2, totalCheckIns: 3, currentTier: "bronze", gender: "female" },
  { username: "vu_trong_g", email: "vutrongg@gmail.com", xp: 3000, level: 6, gems: 300, streakCount: 35, longestStreak: 42, totalCheckIns: 60, currentTier: "legend", gender: "male" },
  { username: "bui_thi_h", email: "buithih@gmail.com", xp: 600, level: 3, gems: 45, streakCount: 10, longestStreak: 14, totalCheckIns: 20, currentTier: "silver", gender: "female" },
  { username: "do_minh_i", email: "dominhi@gmail.com", xp: 180, level: 2, gems: 12, streakCount: 4, longestStreak: 6, totalCheckIns: 8, currentTier: "bronze", gender: "male" },
  { username: "phan_thu_j", email: "phanthuj@gmail.com", xp: 1100, level: 4, gems: 90, streakCount: 15, longestStreak: 20, totalCheckIns: 30, currentTier: "gold", gender: "female" },
  { username: "ly_hoang_k", email: "lyhoangk@gmail.com", xp: 55, level: 1, gems: 2, streakCount: 1, longestStreak: 1, totalCheckIns: 2, currentTier: "bronze", gender: "male" },
  { username: "ngo_trang_l", email: "ngotranl@gmail.com", xp: 1600, level: 4, gems: 140, streakCount: 22, longestStreak: 28, totalCheckIns: 45, currentTier: "diamond", gender: "female" },
  { username: "dang_khoa_m", email: "dangkhoam@gmail.com", xp: 420, level: 2, gems: 30, streakCount: 7, longestStreak: 10, totalCheckIns: 14, currentTier: "bronze", gender: "male" },
  { username: "maithi_n", email: "maithin@gmail.com", xp: 950, level: 3, gems: 70, streakCount: 13, longestStreak: 16, totalCheckIns: 28, currentTier: "silver", gender: "female" },
  { username: "truong_van_o", email: "truongvano@gmail.com", xp: 2800, level: 6, gems: 260, streakCount: 32, longestStreak: 40, totalCheckIns: 55, currentTier: "legend", gender: "male" },
];

function computeLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);
}

function computeTier(xp: number): string {
  if (xp >= 2500) return "legend";
  if (xp >= 1500) return "diamond";
  if (xp >= 800) return "gold";
  if (xp >= 300) return "silver";
  return "bronze";
}

async function main() {
  console.log("\n👤 Seeding 15 new users with @gmail.com\n");

  let created = 0;
  let skipped = 0;

  for (const u of NEW_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`   ⏭  ${u.username} (${u.email}) — already exists`);
      skipped++;
      continue;
    }

    const level = computeLevel(u.xp);
    const tier = computeTier(u.xp);
    const daysAgo = Math.floor(Math.random() * 20) + 5;

    await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        passwordHash: DEFAULT_PASSWORD_HASH,
        gender: u.gender,
        status: "ACTIVE",
        roleId: USER_ROLE_ID,
        xp: u.xp,
        level,
        gems: u.gems,
        streakCount: u.streakCount,
        longestStreak: u.longestStreak,
        totalCheckIns: u.totalCheckIns,
        currentTier: tier,
        lastLoginDate: new Date(),
        lastCheckInDate: new Date(),
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      },
    });
    console.log(`   ✓ ${u.username} (${u.email}) — Lv${level} | ${u.xp} XP | ${u.gems}💎 | streak ${u.streakCount} | ${tier}`);
    created++;
  }

  const total = await prisma.user.count();
  console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}, Total users: ${total}`);
}

main()
  .catch((err) => { console.error("❌ Error:", err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
