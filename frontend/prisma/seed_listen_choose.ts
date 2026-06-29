/**
 * SEED LISTEN_CHOOSE 3-STAGE (SP-fix) - Re-generate Question + AnswerOption cho mode listen_choose.
 *
 * Chỉ re-generate listen_choose questions (CĐ1-3). Copy audioUrl từ WordItem DB hiện có,
 * KHÔNG re-fetch API → tránh regression SP3a local audio.
 *
 * Chạy: npx tsx prisma/seed_listen_choose.ts
 * Yêu cầu: DB đã seed đầy đủ (SP3a) + schema đã db push.
 */

import { PrismaClient } from "@prisma/client";
import { SOUND_GROUPS } from "./lesson-catalog";
import { getContentBySoundGroup } from "./lesson-content";
import {
  buildListenChooseQuestions,
  filterSinglePhonemeWords,
  buildContrastPhonemes,
  type ListenChooseWord,
} from "./listen-choose-builder";

const prisma = new PrismaClient();

function generateQuestionId(exerciseId: string, index: number): string {
  return `${exerciseId.replace("ex-", "q-")}-${String(index).padStart(3, "0")}`;
}

async function main() {
  console.log("🎧 Re-generating listen_choose 3-stage questions (no audio re-fetch)...");

  let totalQuestions = 0;
  let totalExercises = 0;
  let skipped = 0;

  for (const sg of SOUND_GROUPS) {
    if (sg.topicId === "topic-4-stress-connected") continue; // CĐ4 dùng mode_a_listen_choose

    const content = getContentBySoundGroup(sg.id);
    if (!content || content.words.length === 0) continue;

    const exerciseId = `ex-${sg.id}-listen_choose`;
    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) continue;

    // 1. Pool từ ACTIVE (copy audioUrl từ WordItem DB, không re-fetch)
    const poolWords: ListenChooseWord[] = [];
    for (const w of content.words) {
      const wordItem = await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } });
      if (wordItem && wordItem.status === "ACTIVE" && wordItem.audioUrl) {
        poolWords.push({
          word: w.word,
          ipa: w.ipa,
          targetPhoneme: w.targetPhonemes[0],
          audioUrl: wordItem.audioUrl,
        });
      }
    }

    // 2. Contrast (mồi nếu nhóm 1-âm: orderIndex±1 cùng topic)
    let neighborPhoneme: string | null = null;
    if (sg.targetPhonemes.length === 1) {
      const neighbor = SOUND_GROUPS.find(
        (n) => n.topicId === sg.topicId && Math.abs(n.orderIndex - sg.orderIndex) === 1,
      );
      neighborPhoneme = neighbor?.targetPhonemes[0] ?? null;
    }
    const contrastPhonemes = buildContrastPhonemes(sg.targetPhonemes, neighborPhoneme);

    // 3. Lọc 1-âm contrast
    const filteredPool = filterSinglePhonemeWords(poolWords, contrastPhonemes);
    if (filteredPool.length === 0) {
      console.warn(`   ⚠️  ${sg.id}: pool rỗng sau lọc 1-âm → DRAFT, skip.`);
      await prisma.exercise.update({ where: { id: exerciseId }, data: { status: "DRAFT", questionCount: 0 } });
      skipped++;
      continue;
    }

    // 4. Sinh 10 câu 3-stage (4/4/2; pool <10 → lặp cycle)
    const questions3stage = buildListenChooseQuestions(filteredPool, contrastPhonemes);

    // Xóa câu listen_choose cũ của exercise (idempotent)
    await prisma.question.deleteMany({ where: { exerciseId } });

    let qIdx = 1;
    for (const q of questions3stage) {
      const questionId = generateQuestionId(exerciseId, qIdx);
      const contentJson = JSON.stringify({
        mode: "listen_choose",
        answerType: "phoneme",
        stage: q.stage,
        word: q.word,
        ipa: q.ipa,
        audioUrl: q.audioUrl,
        targetPhoneme: q.targetPhoneme,
        contrastPhonemes: q.contrastPhonemes,
        skeleton: q.skeleton,
      });

      await prisma.question.create({
        data: {
          id: questionId,
          name: `Q${qIdx}`,
          content: contentJson,
          answer: q.answer, // = targetPhoneme
          score: 10,
          status: "ACTIVE",
          typeId: "qtype-1-mc",
          exerciseId,
        },
      });

      // AnswerOption = contrastPhonemes (IPA y nguyên)
      for (const ph of q.contrastPhonemes) {
        await prisma.answerOption.create({
          data: { content: ph, questionId },
        });
      }

      qIdx++;
      totalQuestions++;
    }

    // Cập nhật questionCount + status ACTIVE
    await prisma.exercise.update({
      where: { id: exerciseId },
      data: { questionCount: questions3stage.length, status: "ACTIVE" },
    });
    totalExercises++;
    console.log(`   ✓ ${sg.id}: ${questions3stage.length} câu 3-stage (contrast: ${contrastPhonemes.join(", ")})`);
  }

  console.log(`\n✅ ${totalQuestions} questions trong ${totalExercises} exercises listen_choose`);
  if (skipped > 0) console.log(`   ⚠️  ${skipped} exercises skipped (pool rỗng)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
