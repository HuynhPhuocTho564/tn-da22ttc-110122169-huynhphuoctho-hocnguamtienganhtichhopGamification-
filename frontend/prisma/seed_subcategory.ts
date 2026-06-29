/**
 * SEED SUBCATEGORY (SP3a-fix) - Cập nhật subcategory lên DB hiện tại.
 *
 * Chỉ upsert subcategory trên SoundGroup + LearningMap. KHÔNG re-fetch audio,
 * KHÔNG đổi content (words/pairs/sentences) → tránh regression SP3a local audio.
 *
 * Chạy: npx tsx prisma/seed_subcategory.ts
 * Yêu cầu: DB đã seed đầy đủ (SP3a) + đã db push (cột subcategory tồn tại, Task 2).
 */

import { PrismaClient } from "@prisma/client";
import { SOUND_GROUPS } from "./lesson-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🏷️  Updating subcategory on SoundGroup + LearningMap (no content/audio re-fetch)...");

  let updatedGroups = 0;
  let updatedMaps = 0;
  let skipped = 0;

  for (const sg of SOUND_GROUPS) {
    const mapId = `map-${sg.id}`;

    const existingGroup = await prisma.soundGroup.findUnique({ where: { id: sg.id } });
    if (!existingGroup) {
      console.warn(`   ⚠️  SoundGroup ${sg.id} không có trong DB — bỏ qua (cần seed đầy đủ trước).`);
      skipped++;
      continue;
    }

    await prisma.soundGroup.update({
      where: { id: sg.id },
      data: { subcategory: sg.subcategory },
    });
    updatedGroups++;

    const existingMap = await prisma.learningMap.findUnique({ where: { id: mapId } });
    if (existingMap) {
      await prisma.learningMap.update({
        where: { id: mapId },
        data: { subcategory: sg.subcategory },
      });
      updatedMaps++;
    } else {
      console.warn(`   ⚠️  LearningMap ${mapId} không có trong DB — bỏ qua.`);
    }
  }

  console.log(`\n   ✓ ${updatedGroups} SoundGroups, ${updatedMaps} LearningMaps updated`);
  if (skipped > 0) console.log(`   ⚠️  ${skipped} nhóm bị bỏ qua`);

  // === DB VERIFICATION ===
  const groupCounts = await prisma.soundGroup.groupBy({ by: ["subcategory"], _count: true });
  console.log("\n📊 DB verification (SoundGroup by subcategory):");
  for (const row of groupCounts) {
    console.log(`   ${row.subcategory ?? "null"}: ${row._count}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
