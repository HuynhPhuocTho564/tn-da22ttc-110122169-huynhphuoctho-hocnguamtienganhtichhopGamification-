/**
 * Seed ShopItem catalog with 9 default items across 3 categories.
 *
 * Idempotent — re-running upserts by `key` so cost/name/description tweaks
 * propagate without creating duplicates.
 *
 * Usage: `npx tsx prisma/seed_shop_items.ts`
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedShopItem = {
  key: string;
  name: string;
  description: string;
  cost: number;
  category: "power_up" | "protection" | "cosmetic";
  sortOrder: number;
};

const DEFAULT_SHOP_ITEMS: SeedShopItem[] = [
  { key: "streak_freeze", name: "Bùa đóng băng Streak", description: "Bảo vệ streak 1 ngày khi bỏ lỡ", cost: 30, category: "protection", sortOrder: 10 },
  { key: "xp_boost",      name: "Sách Thần (XP Boost)", description: "x1.5 XP cho 3 bài tiếp theo", cost: 50, category: "power_up", sortOrder: 20 },
  { key: "hint_token",    name: "Gợi Ý Vàng",          description: "Hiện gợi ý cho 1 câu khó",      cost: 20, category: "power_up", sortOrder: 30 },
  { key: "second_chance", name: "Cơ Hội Thứ Hai",      description: "Làm lại 1 bài không mất lượt",  cost: 40, category: "power_up", sortOrder: 40 },
  { key: "ipa_reveal",    name: "Kính Lúp IPA",         description: "Mở khóa chế độ xem IPA cho người mới", cost: 60, category: "power_up", sortOrder: 50 },
  { key: "frame_gold",    name: "Khung avatar Vàng",    description: "Trang trí profile (cosmetic)",   cost: 120, category: "cosmetic", sortOrder: 60 },
  { key: "frame_fire",    name: "Khung avatar Lửa",     description: "Trang trí profile (cosmetic)",   cost: 80,  category: "cosmetic", sortOrder: 70 },
  { key: "title_scholar", name: "Danh hiệu Học Giả",   description: "Hiển thị bên cạnh tên (cosmetic)", cost: 100, category: "cosmetic", sortOrder: 80 },
  { key: "title_champion",name: "Danh hiệu Nhà Vô Địch", description: "Hiển thị bên cạnh tên (cosmetic)", cost: 150, category: "cosmetic", sortOrder: 90 },
];

async function main() {
  console.log("🛒 Seeding ShopItem catalog...");
  for (const item of DEFAULT_SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        description: item.description,
        cost: item.cost,
        category: item.category,
        sortOrder: item.sortOrder,
        status: "ACTIVE",
      },
      create: item,
    });
  }
  console.log(`   ✓ ${DEFAULT_SHOP_ITEMS.length} ShopItems seeded`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
