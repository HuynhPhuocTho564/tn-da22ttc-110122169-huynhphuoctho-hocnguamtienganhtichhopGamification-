/**
 * DB CLEANUP - Dọn triệt để database về trạng thái rỗng (B1)
 *
 * Mục đích: xóa toàn bộ dữ liệu thừa/rác từ seed đời trước:
 *   - 5 topic cũ (topic-1..topic-5) ngoài kế hoạch 4 chủ đề
 *   - exercise/map thừa, exercise LOCKED rác
 *   - AnswerOption distractor giả
 *   - User/Leaderboard/ExerciseAttempt/Badge/UserBadge test cũ
 *
 * Cách: TRUNCATE tất cả bảng trong public schema + CASCADE + RESTART IDENTITY.
 * Schema (cấu trúc bảng) KHÔNG bị thay đổi.
 *
 * Chạy: npx tsx prisma/db_cleanup.ts
 *
 * Sau khi chạy xong cần seed lại bằng: npm run db:seed:lessons
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Danh sách tất cả bảng trong public schema (khớp schema.prisma + bảng join _ExerciseAudios)
const TABLES = [
  "AnswerOption",
  "AudioFile",
  "Badge",
  "DailyActivity",
  "Exercise",
  "ExerciseAttempt",
  "Leaderboard",
  "LearningMap",
  "Level",
  "MinimalPair",
  "PasswordResetToken",
  "Phoneme",
  "Progress",
  "Question",
  "QuestionAttempt",
  "QuestionBankItem",
  "QuestionType",
  "Role",
  "SentenceItem",
  "SoundGroup",
  "SoundGroupPhoneme",
  "Topic",
  "User",
  "UserBadge",
  "WordItem",
  "_ExerciseAudios",
];

async function main() {
  console.log("🧹 Bắt đầu dọn triệt để database (B1)...\n");

  // Lấy danh sách bảng thực tế trong DB để tránh lỗi do lệch schema
  const existing = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name;`,
  );
  const existingNames = new Set(existing.map((r) => r.table_name));
  const toTruncate = TABLES.filter((t) => existingNames.has(t));

  console.log(`   Tìm thấy ${existingNames.size} bảng trong DB.`);
  console.log(`   Sẽ TRUNCATE ${toTruncate.length} bảng (CASCADE + RESTART IDENTITY).\n`);

  // TRUNCATE tất cả trong 1 statement; CASCADE tự xử lý foreign key.
  const list = toTruncate.map((t) => `"${t}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`,
  );

  // Xác minh
  const remaining = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*)::bigint AS n
     FROM (
       SELECT 1 FROM "Topic" UNION ALL
       SELECT 1 FROM "Exercise" UNION ALL
       SELECT 1 FROM "LearningMap" UNION ALL
       SELECT 1 FROM "Question" UNION ALL
       SELECT 1 FROM "QuestionBankItem" UNION ALL
       SELECT 1 FROM "WordItem" UNION ALL
       SELECT 1 FROM "User" UNION ALL
       SELECT 1 FROM "SoundGroup"
     ) AS rows;`,
  );

  console.log(`✅ Đã dọn xong. Tổng số dòng còn lại ở 8 bảng chính: ${remaining[0].n}`);
  console.log("   → Database đã rỗng, sẵn sàng seed lại.");
  console.log('   → Chạy tiếp: npm run db:seed:lessons');
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi dọn DB:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
