/**
 * MIGRATE DEMO EMAILS → GMAIL — Đổi email @demo.* của user trong DB thành @gmail.com.
 *
 * Bối cảnh: source code seed_learner_profiles.ts đã cập nhật sang @gmail.com từ trước,
 * nhưng database vẫn chứa user cũ với email @demo.app / @demo.com do chạy seed bản cũ.
 * Trang admin đọc email trực tiếp từ DB nên hiển thị @demo — script này dọn lại.
 *
 * Đặc tính:
 * - Idempotent: chạy lại nhiều lần không lỗi (sau lần 1 sẽ báo "0 user cần đổi").
 * - Dry-run: mặc định chỉ LIỆT KÊ user sẽ đổi, KHÔNG ghi DB.
 *   Truyền --apply để ghi thật.
 * - Collision-safe: nếu @gmail.com đã tồn tại cho user khác → bỏ qua + cảnh báo.
 * - Cascade-safe: các bảng khác reference userId (không phải email) → đổi an toàn.
 *
 * Chạy:
 *   npx tsx prisma/migrate_demo_emails_to_gmail.ts            # dry-run
 *   npx tsx prisma/migrate_demo_emails_to_gmail.ts --apply    # ghi DB thật
 *
 * Sau khi migrate xong:
 *   npx tsx prisma/seed_learner_profiles.ts                   # đồng bộ data learner
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_DOMAIN_PATTERN = /@demo(\.[a-z]+)?$/i;
const TARGET_DOMAIN = "gmail.com";

type PlannedChange = {
  id: string;
  username: string;
  oldEmail: string;
  newEmail: string;
};

type SkippedUser = {
  id: string;
  username: string;
  oldEmail: string;
  conflictEmail: string;
};

async function findDemoUsers() {
  return prisma.user.findMany({
    where: { email: { contains: "@demo" } },
    select: {
      id: true,
      username: true,
      email: true,
      role: { select: { name: true } },
    },
    orderBy: { email: "asc" },
  });
}

function planEmailChange(oldEmail: string): string {
  return oldEmail.replace(DEMO_DOMAIN_PATTERN, `@${TARGET_DOMAIN}`);
}

function isDryRun(): boolean {
  return !process.argv.includes("--apply");
}

async function main() {
  const dryRun = isDryRun();
  console.log("🔍 MIGRATE DEMO EMAILS → GMAIL.COM");
  console.log(`   Mode: ${dryRun ? "DRY-RUN (không ghi DB)" : "APPLY (ghi DB thật)"}\n`);

  const demoUsers = await findDemoUsers();

  if (demoUsers.length === 0) {
    console.log("✅ Không có user nào dùng email @demo. DB đã sạch — không cần migrate.");
    return;
  }

  console.log(`📋 Tìm thấy ${demoUsers.length} user có email chứa @demo:\n`);
  for (const u of demoUsers) {
    console.log(`   • ${u.email.padEnd(28)} | username=${u.username.padEnd(20)} | role=${u.role.name}`);
  }

  const planned: PlannedChange[] = [];
  const skipped: SkippedUser[] = [];
  const seenNewEmails = new Set<string>();

  for (const u of demoUsers) {
    const newEmail = planEmailChange(u.email);

    const conflict = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true, username: true },
    });

    if (conflict && conflict.id !== u.id) {
      skipped.push({
        id: u.id,
        username: u.username,
        oldEmail: u.email,
        conflictEmail: `${newEmail} (đang thuộc ${conflict.username})`,
      });
      continue;
    }

    if (seenNewEmails.has(newEmail)) {
      skipped.push({
        id: u.id,
        username: u.username,
        oldEmail: u.email,
        conflictEmail: `${newEmail} (đã được map từ user @demo khác)`,
      });
      continue;
    }

    seenNewEmails.add(newEmail);
    planned.push({ id: u.id, username: u.username, oldEmail: u.email, newEmail });
  }

  console.log(`\n📊 Kế hoạch:`);
  console.log(`   Sẽ migrate : ${planned.length}`);
  console.log(`   Bỏ qua      : ${skipped.length}`);

  if (planned.length > 0) {
    console.log(`\n   Thay đổi dự kiến:`);
    for (const p of planned) {
      console.log(`     ${p.oldEmail.padEnd(28)} → ${p.newEmail}`);
    }
  }

  if (skipped.length > 0) {
    console.log(`\n   ⚠️ Bỏ qua do trùng email đích:`);
    for (const s of skipped) {
      console.log(`     ${s.oldEmail.padEnd(28)} | username=${s.username.padEnd(20)} | conflict: ${s.conflictEmail}`);
    }
    console.log(`   → Xử lý thủ công: xóa user @gmail.com trùng, hoặc đổi user @demo sang domain khác.`);
  }

  if (planned.length === 0) {
    console.log(`\n✅ Không có thay đổi nào được áp dụng.`);
    return;
  }

  if (dryRun) {
    console.log(`\n💡 Đây là DRY-RUN — DB chưa bị thay đổi.`);
    console.log(`   Để ghi thật, chạy: npx tsx prisma/migrate_demo_emails_to_gmail.ts --apply`);
    return;
  }

  console.log(`\n⏳ Đang ghi DB...`);
  let success = 0;
  let failed = 0;
  for (const p of planned) {
    try {
      await prisma.user.update({
        where: { id: p.id },
        data: { email: p.newEmail },
      });
      console.log(`   ✓ ${p.oldEmail} → ${p.newEmail}`);
      success++;
    } catch (err) {
      console.error(`   ✗ ${p.oldEmail} → ${p.newEmail} | Lỗi:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Hoàn tất: ${success} cập nhật, ${failed} lỗi, ${skipped.length} bỏ qua.`);
  console.log(`\n📌 Bước tiếp theo:`);
  console.log(`   1. Chạy lại script (không flag) để xác nhận không còn user @demo.`);
  console.log(`   2. Chạy: npx tsx prisma/seed_learner_profiles.ts`);
  console.log(`      → Upsert sẽ đồng bộ XP/level/streak/gems cho user đã đổi email.`);
  console.log(`   3. Mở /admin để xác minh email hiển thị @gmail.com.`);
}

main()
  .catch((e) => {
    console.error("❌ Migration lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
