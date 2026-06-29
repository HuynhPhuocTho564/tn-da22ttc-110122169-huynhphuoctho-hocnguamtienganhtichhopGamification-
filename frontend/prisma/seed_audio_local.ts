/**
 * SEED AUDIO LOCAL - Rút ruột audio mp3 về public/audio (chạy 1 lần lúc code)
 *
 * Mục đích: app tự chứa audio, không phụ thuộc API runtime → an toàn bảo vệ phản biện.
 * Nguồn: Free Dictionary API (audio từ Wiktionary, CC-BY-SA 3.0).
 *
 * Pipeline:
 * 1. Đọc tất cả WordItem có sourceType = "FREE_API" trong DB
 * 2. Với mỗi từ: nếu public/audio/{word}.mp3 đã có → skip (idempotent)
 *    - Gọi https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 *    - Lấy link mp3 (ưu tiên UK, sau US, sau bất kỳ)
 *    - Tải mp3 về frontend/public/audio/{word}.mp3
 *    - Cập nhật DB: audioUrl = "/audio/{word}.mp3", audioSource = "FREE_DICTIONARY"
 *    - Nếu fail/không audio → giữ status = NEEDS_REVIEW, audioUrl = null
 * 3. Log: số từ tải thành công, số fail
 *
 * Chạy: npx tsx prisma/seed_audio_local.ts
 */

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, "..", "public", "audio");

async function fetchAudioLink(word: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ phonetics?: Array<{ audio?: string }> }>;
    const phonetics = data[0]?.phonetics ?? [];
    const uk = phonetics.find((p) => p.audio && p.audio.includes("-uk"));
    const us = phonetics.find((p) => p.audio && p.audio.includes("-us"));
    const any = phonetics.find((p) => p.audio && p.audio.length > 0);
    const chosen = uk?.audio || us?.audio || any?.audio || null;
    return chosen && chosen.startsWith("https") ? chosen : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadMp3(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🔊 Rút ruột audio local về public/audio...\n");
  await fs.mkdir(AUDIO_DIR, { recursive: true });

  const words = await prisma.wordItem.findMany({
    where: { sourceType: "FREE_API" },
    select: { id: true, word: true, audioUrl: true, status: true },
  });
  console.log(`   Tìm thấy ${words.length} WordItem FREE_API.`);

  let success = 0;
  let skipped = 0;
  let failed = 0;
  const failedWords: string[] = [];

  for (const w of words) {
    const localPath = join(AUDIO_DIR, `${w.word}.mp3`);
    const localUrl = `/audio/${w.word}.mp3`;

    // Idempotent: skip nếu file đã có
    try {
      await fs.access(localPath);
      // File đã có → cập nhật DB: audioUrl local + flip status ACTIVE
      // (status có thể bị NEEDS_REVIEW do API flaky lúc seed_lessons, dù file local đã có từ run trước)
      const needsUpdate =
        w.audioUrl !== localUrl || w.status !== "ACTIVE";
      if (needsUpdate) {
        await prisma.wordItem.update({
          where: { id: w.id },
          data: { audioUrl: localUrl, audioSource: "FREE_DICTIONARY", status: "ACTIVE" },
        });
      }
      skipped++;
      continue;
    } catch {
      // File chưa có → tiếp tục tải
    }

    const link = await fetchAudioLink(w.word);
    if (!link) {
      console.warn(`   ⚠️  Không có audio cho "${w.word}" → NEEDS_REVIEW`);
      await prisma.wordItem.update({
        where: { id: w.id },
        data: { status: "NEEDS_REVIEW", audioUrl: null },
      });
      failed++;
      failedWords.push(w.word);
      continue;
    }

    const ok = await downloadMp3(link, localPath);
    if (!ok) {
      console.warn(`   ⚠️  Tải mp3 fail cho "${w.word}" → NEEDS_REVIEW`);
      await prisma.wordItem.update({
        where: { id: w.id },
        data: { status: "NEEDS_REVIEW", audioUrl: null },
      });
      failed++;
      failedWords.push(w.word);
      continue;
    }

    await prisma.wordItem.update({
      where: { id: w.id },
      data: { audioUrl: localUrl, audioSource: "FREE_DICTIONARY", status: "ACTIVE" },
    });
    success++;
    console.log(`   ✅ ${w.word} → ${localUrl}`);
  }

  console.log(`\n📊 Kết quả: ${success} tải mới, ${skipped} đã có (skip), ${failed} fail (NEEDS_REVIEW).`);
  if (failedWords.length > 0) {
    console.log(`   Từ fail: ${failedWords.join(", ")}`);
  }
  console.log(`\n💡 Audio lưu tại frontend/public/audio/ (CC-BY-SA Wiktionary qua Free Dictionary API).`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
