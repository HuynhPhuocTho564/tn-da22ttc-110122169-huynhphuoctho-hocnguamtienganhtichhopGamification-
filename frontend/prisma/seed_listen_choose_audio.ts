/**
 * SEED LISTEN_CHOOSE CONTRAST AUDIO (SP1) - Bake option.audioUrl vào content listen_choose.
 *
 * Cho phoneme-mode 3-stage: mỗi contrastPhoneme → tìm 1 WordItem ACTIVE có targetPhoneme đó
 * trong cùng sound group → lấy audioUrl. Add options[{text:phoneme, audioUrl}] vào content JSON.
 * KHÔNG re-fetch API → copy từ WordItem DB hiện có (an toàn SP3a local audio).
 *
 * Chạy: npx tsx prisma/seed_listen_choose_audio.ts
 */

import { PrismaClient } from "@prisma/client";
import { SOUND_GROUPS } from "./lesson-catalog";
import { getContentBySoundGroup } from "./lesson-content";

const prisma = new PrismaClient();

async function main() {
  console.log("🔊 Baking contrast audioUrls vào listen_choose content (no re-fetch)...");

  let updated = 0;
  let noAudio = 0;

  for (const sg of SOUND_GROUPS) {
    if (sg.topicId === "topic-4-stress-connected") continue;
    const content = getContentBySoundGroup(sg.id);
    if (!content) continue;

    const exerciseId = `ex-${sg.id}-listen_choose`;
    const questions = await prisma.question.findMany({ where: { exerciseId } });

    for (const q of questions) {
      const parsed = JSON.parse(q.content) as {
        mode: string;
        answerType?: string;
        contrastPhonemes?: string[];
        word?: string;
        ipa?: string;
        audioUrl?: string;
        options?: Array<{ text: string; audioUrl?: string }>;
        [k: string]: unknown;
      };

      if (parsed.mode !== "listen_choose" || parsed.answerType !== "phoneme" || !parsed.contrastPhonemes) {
        continue; // skip câu word-mode cũ hoặc không phải listen_choose phoneme
      }

      // Build options từ contrastPhonemes: mỗi phoneme → 1 word ACTIVE có targetPhoneme đó + audioUrl
      const options: Array<{ text: string; audioUrl?: string }> = [];
      for (const ph of parsed.contrastPhonemes) {
        const candidate = content.words.find((w) => w.targetPhonemes[0] === ph);
        if (candidate) {
          const wordItem = await prisma.wordItem.findFirst({
            where: { word: candidate.word, ipa: candidate.ipa },
          });
          if (wordItem && wordItem.status === "ACTIVE" && wordItem.audioUrl) {
            options.push({ text: ph, audioUrl: wordItem.audioUrl });
          } else {
            options.push({ text: ph }); // no audio → ẩn nút loa (graceful)
            noAudio++;
          }
        } else {
          options.push({ text: ph });
          noAudio++;
        }
      }

      const newContent = JSON.stringify({ ...parsed, options });
      await prisma.question.update({ where: { id: q.id }, data: { content: newContent } });
      updated++;
    }
  }

  console.log(`\n✅ ${updated} questions updated với contrast audioUrls`);
  if (noAudio > 0) console.log(`   ⚠️  ${noAudio} option không có audio (ẩn nút loa, graceful)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
