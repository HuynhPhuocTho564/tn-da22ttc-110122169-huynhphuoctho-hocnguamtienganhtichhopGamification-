/**
 * UNLOCK ALL MAPS - Mở khóa toàn bộ learning map cho user
 * Tạo exerciseAttempt records (score >= 60) để frontend hiển thị đảo đã mở.
 * Chạy: npx tsx prisma/unlock_all_maps.ts <email>
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "thott7290415@gmail.com";

  console.log(`\n🔓 Unlocking all maps for: ${email}\n`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }
  console.log(`   ✓ User: ${user.username ?? user.id} (${user.email})`);

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, map: { select: { name: true } } },
    orderBy: { id: "asc" },
  });
  console.log(`   Found ${exercises.length} exercises`);

  let created = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const existing = await prisma.exerciseAttempt.findFirst({
      where: { userId: user.id, exerciseId: ex.id, score: { gte: 60 } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.exerciseAttempt.create({
      data: {
        userId: user.id,
        exerciseId: ex.id,
        score: 85,
        attemptCount: 1,
        status: "COMPLETED",
      },
    });
    created++;
    console.log(`   ✓ ${ex.map.name} → ${ex.name}`);
  }

  console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}, Total: ${exercises.length}`);
}

main()
  .catch((err) => { console.error("❌ Error:", err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
