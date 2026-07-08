/**
 * SEED LESSONS - Script seed hệ thống bài học đầy đủ (bản sửa lỗi 18/06/2026)
 *
 * Pipeline (theo DATA_SEED_PLAN.md mục 5 & LESSON_CODING_PLAN.md Phase B):
 * 1. Seed QuestionTypes
 * 2. Seed Topics (4 chủ đề)
 * 3. Seed Phonemes (44 âm IPA)
 * 4. Seed SoundGroups (25 nhóm) + SoundGroupPhoneme
 * 5. Seed WordItems, MinimalPairs, SentenceItems
 * 6. Seed QuestionBankItem (KHO NGUỒN - sửa lỗi NGHIÊM TRỌNG 2)
 * 7. Generate LearningMaps (25 maps)
 * 8. Generate Exercises (100 bài = 25 groups × 4 modes) - gán topicId ĐÚNG (sửa lỗi NGHIÊM TRỌNG 1)
 * 9. Generate Questions từ QuestionBankItem (distractor THẬT - sửa lỗi CAO 5)
 *
 * Sửa lỗi so với bản cũ:
 * - [NGHIÊM TRỌNG 1] topicId: gán theo sg.topicId, KHÔNG dùng findFirst() cho tất cả.
 * - [NGHIÊM TRỌNG 2] Tạo QuestionBankItem (kho nguồn) trước, Question sinh từ kho.
 * - [NGHIÊM TRỌNG 3] Fetch audio thật từ Free Dictionary API cho WordItem; item thiếu audio
 *   -> status = NEEDS_REVIEW, KHÔNG đưa vào listen_choose (theo DATA_SEED_PLAN mục 8).
 * - [CAO 5] Distractor là từ thật từ cùng sound group (ưu tiên cặp minimal pair), KHÔNG phải "distractor1/2/3".
 * - Question.content lưu JSON chuẩn để ExerciseEngineClient render đúng (word/ipa/audioUrl/hint/options).
 *
 * Chạy: npm run db:seed:lessons  (hoặc npx prisma db seed)
 */

import { PrismaClient, Prisma } from "@prisma/client";
import {
  TOPICS,
  SOUND_GROUPS,
  EXERCISE_MODES,
  PHONEMES,
  getModesForTopic,
} from "./lesson-catalog";
import {
  buildListenChooseQuestions,
  filterSinglePhonemeWords,
  buildContrastPhonemes,
  type ListenChooseWord,
} from "./listen-choose-builder";
import {
  LESSON_CONTENT_BY_SOUND_GROUP,
  getContentBySoundGroup,
  type WordItemData,
  type MinimalPairData,
  type SentenceItemData,
} from "./lesson-content";

const prisma = new PrismaClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateExerciseId(soundGroupId: string, modeId: string): string {
  return `ex-${soundGroupId}-${modeId}`;
}

function generateQuestionId(exerciseId: string, index: number): string {
  return `${exerciseId.replace("ex-", "q-")}-${String(index).padStart(3, "0")}`;
}

function generateBankItemId(prefix: string, soundGroupId: string, index: number): string {
  return `qbi-${soundGroupId}-${prefix}-${String(index).padStart(3, "0")}`;
}

// Map difficulty số (1-10) -> chuỗi enum
function mapDifficulty(d: number): "EASY" | "MEDIUM" | "HARD" {
  if (d <= 2) return "EASY";
  if (d >= 6) return "HARD";
  return "MEDIUM";
}

// v2 CĐ4: map nhóm CĐ4 → QuestionType cụ thể (override catalog placeholder mode_a questionTypeId)
const CD4_QTYPE_BY_GROUP: Record<string, string> = {
  "map-t4-g01-word-stress": "qtype-4-tap-stress",
  "map-t4-g02-weak-forms": "qtype-5-choose-weak",
  "map-t4-g03-linking": "qtype-6-choose-linking",
  "map-t4-g04-assimilation": "qtype-7-choose-assimilation",
};

/**
 * Fetch audio thật từ Free Dictionary API cho một từ.
 * Trả về audioUrl (mp3) nếu có, null nếu không lấy được.
 * Có timeout để không treo seed khi API chậm/lỗi.
 */
async function fetchAudioUrl(word: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      phonetics?: Array<{ audio?: string }>;
    }>;
    const phonetics = data[0]?.phonetics ?? [];
    // Ưu tiên audio UK, sau đó US, sau đó bất kỳ audio nào không rỗng
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

// ============================================================================
// SEED FUNCTIONS - QuestionTypes / Topics / Phonemes / SoundGroups
// ============================================================================

async function seedQuestionTypes() {
  console.log("📦 Seeding Question Types...");

  const questionTypes = [
    {
      id: "qtype-1-mc",
      name: "Trắc nghiệm nghe",
      description: "Nghe audio và chọn đáp án đúng (IPA hoặc từ)",
    },
    {
      id: "qtype-2-voice",
      name: "Đọc từ hoặc câu",
      description: "Đọc từ đơn hoặc câu theo yêu cầu",
    },
    {
      id: "qtype-3-minimal-pairs",
      name: "Đọc cặp từ",
      description: "Đọc cặp minimal pair để phân biệt âm",
    },
    // v2: 4 QuestionType mới cho Chủ đề 4 Trọng âm & Nối âm
    {
      id: "qtype-4-tap-stress",
      name: "Chọn âm tiết nhấn",
      description: "Word Stress Mode A: nghe từ → bấm âm tiết được nhấn",
    },
    {
      id: "qtype-5-choose-weak",
      name: "Chọn từ lướt",
      description: "Weak Forms Mode A: nghe câu → chọn từ bị đọc lướt thành /ə/",
    },
    {
      id: "qtype-6-choose-linking",
      name: "Chọn phát âm nối",
      description: "Linking Mode A: nghe cụm từ → chọn cách phát âm đúng",
    },
    {
      id: "qtype-7-choose-assimilation",
      name: "Chọn câu biến âm",
      description: "Assimilation Mode A: nghe câu tự nhiên → chọn câu vừa nghe",
    },
  ];

  for (const qt of questionTypes) {
    await prisma.questionType.upsert({
      where: { id: qt.id },
      update: qt,
      create: qt,
    });
  }

  console.log(`   ✓ ${questionTypes.length} QuestionTypes created`);
}

async function seedTopics() {
  console.log("📚 Seeding Topics (4 chủ đề v2, unlock tuần tự)...");

  for (const topic of TOPICS) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: {
        name: topic.name,
        description: topic.description,
        orderIndex: topic.orderIndex,
        unlockThresholdPercent: topic.unlockThresholdPercent,
        // mapId is set in the post-map-generation backfill pass below.
      },
      create: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        orderIndex: topic.orderIndex,
        unlockThresholdPercent: topic.unlockThresholdPercent,
        // mapId left null here; populated after LearningMaps exist.
      },
    });
  }

  console.log(`   ✓ ${TOPICS.length} Topics created (unlock: 0/80/80/80)`);
}

async function seedPhonemes() {
  console.log("🔤 Seeding Phonemes...");

  for (const phoneme of PHONEMES) {
    await prisma.phoneme.upsert({
      where: { symbol: phoneme.ipa },
      update: {
        name: phoneme.ipa,
        category: phoneme.type,
        description: phoneme.description,
        status: "ACTIVE",
      },
      create: {
        symbol: phoneme.ipa,
        name: phoneme.ipa,
        category: phoneme.type,
        description: phoneme.description,
        status: "ACTIVE",
      },
    });
  }

  console.log(`   ✓ ${PHONEMES.length} Phonemes created`);
}

async function seedSoundGroups() {
  console.log("🎵 Seeding Sound Groups...");

  for (const sg of SOUND_GROUPS) {
    await prisma.soundGroup.upsert({
      where: { id: sg.id },
      update: {
        name: sg.name,
        description: sg.description,
        orderIndex: sg.orderIndex,
        status: "DRAFT", // Mặc định DRAFT; sẽ chuyển ACTIVE khi có content đầy đủ
        topicId: sg.topicId,
        subcategory: sg.subcategory,
      },
      create: {
        id: sg.id,
        name: sg.name,
        description: sg.description,
        orderIndex: sg.orderIndex,
        status: "DRAFT",
        topicId: sg.topicId,
        subcategory: sg.subcategory,
      },
    });

    // Link Phonemes to SoundGroup
    for (let i = 0; i < sg.targetPhonemes.length; i++) {
      const ipaSymbol = sg.targetPhonemes[i];
      const phoneme = await prisma.phoneme.findUnique({ where: { symbol: ipaSymbol } });

      if (phoneme) {
        await prisma.soundGroupPhoneme.upsert({
          where: {
            soundGroupId_phonemeId: {
              soundGroupId: sg.id,
              phonemeId: phoneme.id,
            },
          },
          update: {
            orderIndex: i + 1,
            role: i === 0 ? "primary" : "secondary",
          },
          create: {
            soundGroupId: sg.id,
            phonemeId: phoneme.id,
            orderIndex: i + 1,
            role: i === 0 ? "primary" : "secondary",
          },
        });
      }
    }
  }

  console.log(`   ✓ ${SOUND_GROUPS.length} SoundGroups created`);
}

// ============================================================================
// SEED WORDS / PAIRS / SENTENCES  (với fetch audio thật)
// ============================================================================

// Cache audio đã fetch để không gọi lại API cho cùng từ (vd "sheep" xuất hiện ở 2 sound group)
const audioCache = new Map<string, string | null>();

async function seedWordItems(soundGroupId: string, words: WordItemData[]) {
  for (const word of words) {
    const firstPhonemeSymbol = word.targetPhonemes[0];
    let phoneme = firstPhonemeSymbol
      ? await prisma.phoneme.findUnique({ where: { symbol: firstPhonemeSymbol } })
      : null;

    // Fallback: nếu không có targetPhonemes, tìm phoneme phù hợp từ IPA
    if (!phoneme) {
      // Try to find a phoneme that matches part of the IPA
      const allPhonemes = await prisma.phoneme.findMany({ select: { id: true, symbol: true } });
      for (const p of allPhonemes) {
        if (word.ipa.includes(p.symbol.replace(/\//g, ""))) {
          phoneme = p as typeof phoneme;
          break;
        }
      }
      if (!phoneme) {
        // Last resort: use the first phoneme in DB
        phoneme = await prisma.phoneme.findFirst({ select: { id: true, symbol: true } });
      }
    }

    if (!phoneme) {
      console.warn(`   ⚠️  Không tìm thấy phoneme cho từ "${word.word}", bỏ qua.`);
      continue;
    }

    // === SỬA LỖI NGHIÊM TRỌNG 3: fetch audio thật, xác định status theo audio ===
    let audioUrl = word.audioUrl ?? null;

    // Idempotent re-seed: nếu DB đã có WordItem ACTIVE với audioUrl local (/audio/...),
    // giữ nguyên audioUrl + status — không re-fetch API (tránh flip ACTIVE→NEEDS_REVIEW
    // khi API flaky dù file local đã có từ seed_audio_local run trước).
    if (!audioUrl) {
      const existing = await prisma.wordItem.findFirst({
        where: { word: word.word, ipa: word.ipa, phonemeId: phoneme.id },
        select: { audioUrl: true, status: true, audioSource: true },
      });
      if (existing && existing.status === "ACTIVE" && existing.audioUrl && existing.audioUrl.startsWith("/audio/")) {
        audioUrl = existing.audioUrl;
      } else if (audioCache.has(word.word)) {
        audioUrl = audioCache.get(word.word) ?? null;
      } else {
        audioUrl = await fetchAudioUrl(word.word);
        audioCache.set(word.word, audioUrl);
        if (audioUrl) {
          console.log(`   🔊 ${word.word}: ${audioUrl}`);
        } else {
          console.warn(`   ⚠️  Không lấy được audio cho "${word.word}" -> giữ NEEDS_REVIEW.`);
        }
      }
    }

    // Quy tắc DATA_SEED_PLAN mục 8: thiếu audio -> NEEDS_REVIEW, không đưa vào listen_choose
    const finalStatus: "ACTIVE" | "NEEDS_REVIEW" = audioUrl ? "ACTIVE" : "NEEDS_REVIEW";

    await prisma.wordItem.upsert({
      where: {
        word_ipa_phonemeId: {
          word: word.word,
          ipa: word.ipa,
          phonemeId: phoneme.id,
        },
      },
      update: {
        audioUrl,
        meaningVi: word.exampleSentence ?? null,
        difficulty: mapDifficulty(word.difficulty),
        status: finalStatus,
        audioSource: word.sourceType === "FREE_API" ? "FREE_DICTIONARY" : "MANUAL",
        sourceType: word.sourceType,
        sourceUrl: word.sourceUrl ?? null,
        reviewNote: word.reviewNote ?? null,
        syllables: word.syllables ? JSON.parse(JSON.stringify(word.syllables)) : null,
        stressIndex: word.stressIndex ?? null,
        wordStressType: word.wordStressType ?? null,
      },
      create: {
        word: word.word,
        ipa: word.ipa,
        phonemeId: phoneme.id,
        audioUrl,
        meaningVi: word.exampleSentence ?? null,
        difficulty: mapDifficulty(word.difficulty),
        status: finalStatus,
        audioSource: word.sourceType === "FREE_API" ? "FREE_DICTIONARY" : "MANUAL",
        sourceType: word.sourceType,
        sourceUrl: word.sourceUrl ?? null,
        reviewNote: word.reviewNote ?? null,
        syllables: word.syllables ? JSON.parse(JSON.stringify(word.syllables)) : null,
        stressIndex: word.stressIndex ?? null,
        wordStressType: word.wordStressType ?? null,
      },
    });
  }
}

async function seedMinimalPairs(soundGroupId: string, pairs: MinimalPairData[]) {
  for (const pair of pairs) {
    const wordA = await prisma.wordItem.findFirst({ where: { word: pair.word1, ipa: pair.ipa1 } });
    const wordB = await prisma.wordItem.findFirst({ where: { word: pair.word2, ipa: pair.ipa2 } });

    if (!wordA || !wordB) {
      console.warn(`   ⚠️  Không tìm thấy từ cho cặp ${pair.word1}/${pair.word2}, bỏ qua.`);
      continue;
    }

    // Minimal pair chỉ ACTIVE khi cả 2 từ đã ACTIVE (có audio)
    const pairStatus: "ACTIVE" | "NEEDS_REVIEW" =
      wordA.status === "ACTIVE" && wordB.status === "ACTIVE" ? "ACTIVE" : "NEEDS_REVIEW";

    await prisma.minimalPair.upsert({
      where: {
        soundGroupId_wordAId_wordBId: {
          soundGroupId: soundGroupId,
          wordAId: wordA.id,
          wordBId: wordB.id,
        },
      },
      update: {
        note: pair.explanation ?? null,
        difficulty: mapDifficulty(pair.difficulty),
        status: pairStatus,
      },
      create: {
        soundGroupId: soundGroupId,
        wordAId: wordA.id,
        wordBId: wordB.id,
        note: pair.explanation ?? null,
        difficulty: mapDifficulty(pair.difficulty),
        status: pairStatus,
      },
    });
  }
}

async function seedSentenceItems(soundGroupId: string, sentences: SentenceItemData[]) {
  for (const sent of sentences) {
    const sentId = `sent-${soundGroupId}-${sent.sentence.substring(0, 20).replace(/\s/g, "-")}`;
    await prisma.sentenceItem.upsert({
      where: { id: sentId },
      update: {
        text: sent.sentence,
        targetWords: JSON.parse(JSON.stringify(sent.targetWords)),
        difficulty: mapDifficulty(sent.difficulty),
        status: sent.status,
        sourceType: sent.sourceType,
        reviewNote: sent.reviewNote ?? null,
      },
      create: {
        id: sentId,
        text: sent.sentence,
        soundGroupId: soundGroupId,
        targetWords: JSON.parse(JSON.stringify(sent.targetWords)),
        difficulty: mapDifficulty(sent.difficulty),
        status: sent.status,
        sourceType: sent.sourceType,
        reviewNote: sent.reviewNote ?? null,
      },
    });
  }
}

async function seedLessonContent() {
  console.log("📝 Seeding Lesson Content (Words, Pairs, Sentences) + fetch audio...");

  let totalWords = 0;
  let totalPairs = 0;
  let totalSentences = 0;

  for (const soundGroupId of Object.keys(LESSON_CONTENT_BY_SOUND_GROUP)) {
    const content = getContentBySoundGroup(soundGroupId);
    if (!content) continue;

    await seedWordItems(soundGroupId, content.words);
    await seedMinimalPairs(soundGroupId, content.minimalPairs);
    await seedSentenceItems(soundGroupId, content.sentences);

    totalWords += content.words.length;
    totalPairs += content.minimalPairs.length;
    totalSentences += content.sentences.length;
  }

  console.log(`   ✓ ${totalWords} WordItems, ${totalPairs} MinimalPairs, ${totalSentences} SentenceItems`);
}

// ============================================================================
// SEED QUESTION BANK ITEMS  (KHO NGUỒN - sửa lỗi NGHIÊM TRỌNG 2)
// ============================================================================

/**
 * Tạo QuestionBankItem (kho câu hỏi mẫu) từ content.
 * Mỗi item link tới QuestionType + SoundGroup + (wordItem | minimalPair | sentenceItem).
 * Question thật sẽ sinh từ kho này ở bước generateQuestions.
 */
async function seedQuestionBankItems() {
  console.log("🏦 Seeding QuestionBankItem (kho nguồn câu hỏi)...");

  let total = 0;
  const qtypes = await prisma.questionType.findMany();
  const qtypeMap = Object.fromEntries(qtypes.map((qt) => [qt.id, qt]));

  for (const soundGroupId of Object.keys(LESSON_CONTENT_BY_SOUND_GROUP)) {
    const content = getContentBySoundGroup(soundGroupId);
    if (!content) continue;

    // --- listen_choose: từ mỗi từ ACTIVE (có audio) tạo 1 bank item ---
    let idx = 1;
    for (const word of content.words) {
      const wordItem = await prisma.wordItem.findFirst({
        where: { word: word.word, ipa: word.ipa },
      });
      if (!wordItem || wordItem.status !== "ACTIVE") continue; // chỉ từ có audio mới vào listen_choose

      const bankId = generateBankItemId("lc", soundGroupId, idx++);
      const contentJson = {
        mode: "listen_choose",
        word: word.word,
        ipa: word.ipa,
        audioUrl: wordItem.audioUrl,
        targetPhonemes: word.targetPhonemes,
      };

      await prisma.questionBankItem.upsert({
        where: { id: bankId },
        update: {
          prompt: `Nghe và chọn từ đúng`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: word.word,
          score: 10,
          difficulty: mapDifficulty(word.difficulty),
          status: "ACTIVE",
          sourceType: word.sourceType,
          questionTypeId: qtypeMap["qtype-1-mc"].id,
          soundGroupId,
          wordItemId: wordItem.id,
        },
        create: {
          id: bankId,
          prompt: `Nghe và chọn từ đúng`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: word.word,
          score: 10,
          difficulty: mapDifficulty(word.difficulty),
          status: "ACTIVE",
          sourceType: word.sourceType,
          questionTypeId: qtypeMap["qtype-1-mc"].id,
          soundGroupId,
          wordItemId: wordItem.id,
        },
      });
      total++;
    }

    // --- speak_word: từ mỗi từ tạo 1 bank item ---
    idx = 1;
    for (const word of content.words) {
      const wordItem = await prisma.wordItem.findFirst({
        where: { word: word.word, ipa: word.ipa },
      });
      if (!wordItem) continue;

      const bankId = generateBankItemId("sw", soundGroupId, idx++);
      const contentJson = {
        mode: "speak_word",
        word: word.word,
        ipa: word.ipa,
        audioUrl: wordItem.audioUrl,
        targetPhonemes: word.targetPhonemes,
        hint: word.reviewNote ?? undefined,
      };

      await prisma.questionBankItem.upsert({
        where: { id: bankId },
        update: {
          prompt: `Đọc từ: ${word.word}`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: word.word,
          score: 15,
          difficulty: mapDifficulty(word.difficulty),
          status: wordItem.status === "ACTIVE" ? "ACTIVE" : "NEEDS_REVIEW",
          sourceType: word.sourceType,
          questionTypeId: qtypeMap["qtype-2-voice"].id,
          soundGroupId,
          wordItemId: wordItem.id,
        },
        create: {
          id: bankId,
          prompt: `Đọc từ: ${word.word}`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: word.word,
          score: 15,
          difficulty: mapDifficulty(word.difficulty),
          status: wordItem.status === "ACTIVE" ? "ACTIVE" : "NEEDS_REVIEW",
          sourceType: word.sourceType,
          questionTypeId: qtypeMap["qtype-2-voice"].id,
          soundGroupId,
          wordItemId: wordItem.id,
        },
      });
      total++;
    }

    // --- speak_minimal_pair: từ mỗi minimal pair tạo 1 bank item ---
    idx = 1;
    for (const pair of content.minimalPairs) {
      const wordA = await prisma.wordItem.findFirst({ where: { word: pair.word1, ipa: pair.ipa1 } });
      const wordB = await prisma.wordItem.findFirst({ where: { word: pair.word2, ipa: pair.ipa2 } });
      const minPair = await prisma.minimalPair.findFirst({
        where: { soundGroupId, wordAId: wordA?.id, wordBId: wordB?.id },
      });
      if (!wordA || !wordB || !minPair) continue;

      const bankId = generateBankItemId("smp", soundGroupId, idx++);
      const contentJson = [
        { word: pair.word1, ipa: pair.ipa1, audioUrl: wordA.audioUrl, hint: pair.explanation },
        { word: pair.word2, ipa: pair.ipa2, audioUrl: wordB.audioUrl },
      ];

      await prisma.questionBankItem.upsert({
        where: { id: bankId },
        update: {
          prompt: `Đọc cặp từ: ${pair.word1} / ${pair.word2}`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: `${pair.word1}, ${pair.word2}`,
          score: 20,
          difficulty: mapDifficulty(pair.difficulty),
          status: minPair.status,
          sourceType: pair.sourceType,
          questionTypeId: qtypeMap["qtype-3-minimal-pairs"].id,
          soundGroupId,
          minimalPairId: minPair.id,
        },
        create: {
          id: bankId,
          prompt: `Đọc cặp từ: ${pair.word1} / ${pair.word2}`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: `${pair.word1}, ${pair.word2}`,
          score: 20,
          difficulty: mapDifficulty(pair.difficulty),
          status: minPair.status,
          sourceType: pair.sourceType,
          questionTypeId: qtypeMap["qtype-3-minimal-pairs"].id,
          soundGroupId,
          minimalPairId: minPair.id,
        },
      });
      total++;
    }

    // --- speak_sentence: từ mỗi câu tạo 1 bank item ---
    idx = 1;
    for (const sent of content.sentences) {
      const sentItem = await prisma.sentenceItem.findFirst({ where: { soundGroupId, text: sent.sentence } });
      if (!sentItem) continue;

      const bankId = generateBankItemId("ss", soundGroupId, idx++);
      const contentJson = {
        mode: "speak_sentence",
        sentence: sent.sentence,
        ipa: sent.ipa ?? undefined,
        targetWords: sent.targetWords,
        targetPhonemes: sent.targetPhonemes,
        hint: sent.translation ?? undefined,
      };

      await prisma.questionBankItem.upsert({
        where: { id: bankId },
        update: {
          prompt: `Đọc câu: ${sent.sentence}`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: sent.sentence,
          score: 25,
          difficulty: mapDifficulty(sent.difficulty),
          status: sentItem.status,
          sourceType: sent.sourceType,
          questionTypeId: qtypeMap["qtype-2-voice"].id,
          soundGroupId,
          sentenceItemId: sentItem.id,
        },
        create: {
          id: bankId,
          prompt: `Đọc câu: ${sent.sentence}`,
          contentJson: JSON.parse(JSON.stringify(contentJson)),
          answer: sent.sentence,
          score: 25,
          difficulty: mapDifficulty(sent.difficulty),
          status: sentItem.status,
          sourceType: sent.sourceType,
          questionTypeId: qtypeMap["qtype-2-voice"].id,
          soundGroupId,
          sentenceItemId: sentItem.id,
        },
      });
      total++;
    }
  }

  console.log(`   ✓ ${total} QuestionBankItems created (kho nguồn)`);
}

// ============================================================================
// GENERATE LEARNING MAPS & EXERCISES
// ============================================================================

async function ensureDefaultLevel() {
  let level = await prisma.level.findFirst({ where: { name: "Beginner" } });
  if (!level) {
    level = await prisma.level.create({
      data: { name: "Beginner", description: "Cấp độ người mới bắt đầu" },
    });
  }
  return level;
}

async function generateLearningMaps() {
  console.log("🗺️  Generating Learning Maps...");

  for (const sg of SOUND_GROUPS) {
    const mapId = `map-${sg.id}`;
    const content = getContentBySoundGroup(sg.id);
    const hasContent = Boolean(content && (content.words.length > 0 || content.sentences.length > 0));

    await prisma.learningMap.upsert({
      where: { id: mapId },
      update: {
        name: sg.name,
        requirement: sg.description,
        status: hasContent ? "ACTIVE" : "DRAFT",
        subcategory: sg.subcategory,
      },
      create: {
        id: mapId,
        name: sg.name,
        requirement: sg.description,
        status: hasContent ? "ACTIVE" : "DRAFT",
        subcategory: sg.subcategory,
      },
    });
  }

  console.log(`   ✓ ${SOUND_GROUPS.length} LearningMaps generated`);

  // Backfill topic.mapId now that LearningMaps exist. Maps are created with
  // names like "Nguyên âm /iː/ vs /ɪ/", so we match the topic's orderIndex
  // (1=vowels, 2=consonants, 3=minimal-pairs, 4=stress-connected) to the
  // first map whose name starts with the topic's category keyword.
  // await backfillTopicMapIds(); // SKIPPED: Topic model has no mapId field
  await backfillMapUnlockChain();
}

/**
 * Set the unlock chain between LearningMaps per spec §1 (PLAN/ADMIN_DASHBOARD_new.md):
 *   - Vowels (Nguyên âm): no prerequisite — always open.
 *   - Consonants (Phụ âm): require Vowels 80% completion.
 *   - Minimal Pairs: require Consonants 80% completion (sequential chain).
 *   - Stress & Linking (Trọng âm & Nối âm): require Minimal Pairs 80% completion.
 *
 * Categorization uses the map ID prefix (`map-map-t1-*` = vowels, `t2` = consonants,
 * `t3` = minimal pairs, `t4` = stress) rather than name matching — name patterns vary
 * (IPA phonetic symbols for vowels/consonants, Vietnamese for minimal pairs,
 * English for stress), but the ID prefix is stable across seeds.
 *
 * Idempotent — safe to run on re-seeds.
 */
async function backfillMapUnlockChain() {
  const CATEGORY_PREFIX = {
    vowels: /^map-map-t1-/i,
    consonants: /^map-map-t2-/i,
    minimalPairs: /^map-map-t3-/i,
    stress: /^map-map-t4-/i,
  } as const;

  const maps = await prisma.learningMap.findMany({ select: { id: true, name: true } });

  // Pick the first map of each category (sorted by name for stability) as the prereq reference.
  const firstInCategory = (pattern: RegExp) =>
    [...maps].filter((m) => pattern.test(m.id)).sort((a, b) => a.name.localeCompare(b.name))[0]?.id;

  const firstVowelMapId = firstInCategory(CATEGORY_PREFIX.vowels);
  const firstConsonantMapId = firstInCategory(CATEGORY_PREFIX.consonants);
  const firstMinimalPairMapId = firstInCategory(CATEGORY_PREFIX.minimalPairs);

  const UNLOCK_CHAIN: Record<string, { prefix: RegExp; requiredMapId: string | null; threshold: number }> = {
    vowels:        { prefix: CATEGORY_PREFIX.vowels,       requiredMapId: null,                            threshold: 0  },
    consonants:    { prefix: CATEGORY_PREFIX.consonants,   requiredMapId: firstVowelMapId ?? null,        threshold: 80 },
    minimalPairs:  { prefix: CATEGORY_PREFIX.minimalPairs, requiredMapId: firstConsonantMapId ?? null,    threshold: 80 },
    stress:        { prefix: CATEGORY_PREFIX.stress,       requiredMapId: firstMinimalPairMapId ?? null,  threshold: 80 },
  };

  let updated = 0;
  for (const map of maps) {
    let chain: { requiredMapId: string | null; threshold: number } | undefined;
    if (CATEGORY_PREFIX.vowels.test(map.id))       chain = UNLOCK_CHAIN.vowels;
    else if (CATEGORY_PREFIX.consonants.test(map.id))    chain = UNLOCK_CHAIN.consonants;
    else if (CATEGORY_PREFIX.minimalPairs.test(map.id))  chain = UNLOCK_CHAIN.minimalPairs;
    else if (CATEGORY_PREFIX.stress.test(map.id))        chain = UNLOCK_CHAIN.stress;

    if (!chain) continue;
    await prisma.learningMap.update({
      where: { id: map.id },
      data: {
        requiredMapId: chain.requiredMapId,
        unlockThresholdPercent: chain.threshold,
      },
    });
    updated += 1;
  }
  console.log(`   ✓ backfilled map unlock chain for ${updated}/${maps.length} maps`);
}

/**
 * Map each Topic to its primary LearningMap. Uses the topic's orderIndex (1=vowels,
 * 2=consonants, 3=minimal, 4=stress) to find the first map of the matching category
 * via ID prefix. Idempotent — safe to run on re-seeds.
 */
async function backfillTopicMapIds() {
  const ORDER_TO_PREFIX: Record<number, RegExp> = {
    1: /^map-map-t1-/i,
    2: /^map-map-t2-/i,
    3: /^map-map-t3-/i,
    4: /^map-map-t4-/i,
  };

  const topics = await prisma.topic.findMany({ select: { id: true, orderIndex: true } });
  const maps = await prisma.learningMap.findMany({ select: { id: true, name: true } });

  let updated = 0;
  for (const topic of topics) {
    const prefix = ORDER_TO_PREFIX[topic.orderIndex];
    if (!prefix) continue;
    const match = maps.find((map) => prefix.test(map.id));
    if (match) {
      await prisma.topic.update({ where: { id: topic.id }, data: { mapId: match.id } });
      updated += 1;
    }
  }
  console.log(`   ✓ backfilled topic.mapId for ${updated}/${topics.length} topics`);
}

/**
 * Tạo mô tả chi tiết cho exercise theo nhóm âm + mode.
 * CĐ1-3: mô tả chung theo mode.
 * CĐ4: mô tả riêng theo từng loại (word stress, weak forms, linking, assimilation).
 */
function getExerciseDescription(sg: { id: string; name: string; topicId: string }, mode: { id: string; name: string }): string {
  // CĐ4: Trọng âm & Nối âm - mô tả riêng cho từng nhóm
  if (sg.topicId === "topic-4-stress-connected") {
    if (sg.id.includes("word-stress")) {
      return mode.id.includes("listen") || mode.id.includes("mode_a")
        ? "Nghe từ và chọn âm tiết được nhấn"
        : "Đọc từ với trọng âm đúng";
    }
    if (sg.id.includes("weak-forms")) {
      return mode.id.includes("listen") || mode.id.includes("mode_a")
        ? "Nghe câu và chọn từ bị đọc lướt (âm yếu /ə/)"
        : "Đọc câu với weak forms tự nhiên";
    }
    if (sg.id.includes("linking")) {
      return mode.id.includes("listen") || mode.id.includes("mode_a")
        ? "Nghe cụm từ và chọn cách nối âm đúng"
        : "Đọc cụm từ với nối âm tự nhiên";
    }
    if (sg.id.includes("assimilation")) {
      return mode.id.includes("listen") || mode.id.includes("mode_a")
        ? "Nghe câu và chọn biến âm phù hợp"
        : "Đọc câu với biến âm tự nhiên";
    }
  }

  // CĐ1-3: mô tả chung theo mode
  if (mode.id === "listen_choose") return "Nghe và chọn IPA/từ đúng";
  if (mode.id === "speak_word") return "Đọc từ đơn theo IPA";
  if (mode.id === "speak_minimal_pair") return "Đọc cặp từ dễ nhầm lẫn";
  if (mode.id === "speak_sentence") return "Đọc câu có chứa âm mục tiêu";

  return mode.name;
}

async function generateExercises() {
  console.log("📋 Generating Exercises (mode theo topic của nhóm)...");

  const defaultLevel = await ensureDefaultLevel();
  let totalExercises = 0;

  for (const sg of SOUND_GROUPS) {
    const mapId = `map-${sg.id}`;
    const content = getContentBySoundGroup(sg.id);
    const hasContent = Boolean(content && (content.words.length > 0 || content.sentences.length > 0));
    // v2: mode theo topic (CĐ1-3: 4 mode chuẩn; CĐ4: 2 mode đặc thù)
    const modesForTopic = getModesForTopic(sg.topicId);

    for (const mode of modesForTopic) {
      const exerciseId = generateExerciseId(sg.id, mode.id);
      const exerciseName = `${sg.name} - ${mode.name}`;

      // Mô tả riêng theo từng nhóm âm + mode
      const description = getExerciseDescription(sg, mode);

      // === SỬA LỖI NGHIÊM TRỌNG 1: gán topicId theo sound group, KHÔNG dùng findFirst() ===
      await prisma.exercise.upsert({
        where: { id: exerciseId },
        update: {
          name: exerciseName,
          description,
          status: hasContent ? "ACTIVE" : "DRAFT",
          topicId: sg.topicId, // <-- gán đúng topic của nhóm âm
          levelId: defaultLevel.id,
        },
        create: {
          id: exerciseId,
          name: exerciseName,
          description,
          topicId: sg.topicId, // <-- gán đúng topic của nhóm âm
          levelId: defaultLevel.id,
          mapId: mapId,
          questionCount: 0, // sẽ cập nhật sau khi generate questions
          timeLimit: 300,
          status: hasContent ? "ACTIVE" : "DRAFT",
        },
      });

      totalExercises++;
    }
  }

  console.log(`   ✓ ${totalExercises} Exercises generated (topicId gán đúng, mode theo topic)`);
}

// ============================================================================
// GENERATE QUESTIONS từ QuestionBankItem  (distractor THẬT)
// ============================================================================

/**
 * Sinh distractor thật cho câu hỏi listen_choose của 1 từ mục tiêu.
 * Ưu tiên: cặp minimal pair của từ đó, sau đó các từ khác trong cùng sound group.
 * Trả về tối đa 3 distractor (không trùng answer).
 */
async function buildDistractors(
  soundGroupId: string,
  answerWord: string,
  contentWords: WordItemData[],
  pairs: MinimalPairData[],
): Promise<string[]> {
  const distractors = new Set<string>();
  const lowerAnswer = answerWord.toLowerCase();

  // 1) Ưu tiên cặp minimal pair: nếu từ mục tiêu là word1 -> lấy word2 và ngược lại
  for (const pair of pairs) {
    if (pair.word1.toLowerCase() === lowerAnswer) {
      distractors.add(pair.word2);
    } else if (pair.word2.toLowerCase() === lowerAnswer) {
      distractors.add(pair.word1);
    }
  }

  // 2) Bổ sung các từ khác trong cùng sound group (ưu tiên từ có audio = ACTIVE)
  if (distractors.size < 3) {
    for (const w of contentWords) {
      if (distractors.size >= 3) break;
      if (w.word.toLowerCase() === lowerAnswer) continue;
      distractors.add(w.word);
    }
  }

  return Array.from(distractors).slice(0, 3);
}

async function generateQuestions() {
  console.log("❓ Generating Questions từ QuestionBankItem...");

  let totalQuestions = 0;
  const qtypes = await prisma.questionType.findMany();
  const qtypeMap = Object.fromEntries(qtypes.map((qt) => [qt.id, qt]));

  for (const sg of SOUND_GROUPS) {
    const content = getContentBySoundGroup(sg.id);
    if (!content || (content.words.length === 0 && content.sentences.length === 0)) continue;

    for (const mode of EXERCISE_MODES) {
      const exerciseId = generateExerciseId(sg.id, mode.id);
      const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
      if (!exercise) continue;

      // === v2 listen_choose 3-stage (phoneme-ID): xử lý theo pool cả nhóm, KHÔNG theo bank item ===
      // Skip CĐ4 (dùng mode_a_listen_choose riêng). Nhánh bank cũ (sau) trở thành unreachable cho listen_choose.
      if (mode.id === "listen_choose" && sg.topicId !== "topic-4-stress-connected") {
        // 1. Pool từ ACTIVE của sound group (tra cứu WordItem lấy audioUrl thật)
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

        // 2. Contrast: nhóm 1-âm → mồi 1 phoneme từ neighbor (orderIndex±1 cùng topic)
        let neighborPhoneme: string | null = null;
        if (sg.targetPhonemes.length === 1) {
          const neighbor = SOUND_GROUPS.find(
            (n) =>
              n.topicId === sg.topicId &&
              Math.abs(n.orderIndex - sg.orderIndex) === 1 &&
              n.targetPhonemes.length >= 1,
          );
          neighborPhoneme = neighbor?.targetPhonemes[0] ?? null;
          if (!neighborPhoneme) {
            console.warn(`   ⚠️  Không tìm neighbor cho nhóm 1-âm ${sg.id}, contrast chỉ 1 nút.`);
          }
        }
        const contrastPhonemes = buildContrastPhonemes(sg.targetPhonemes, neighborPhoneme);

        // 3. Lọc chỉ từ 1-âm contrast (loại từ "nhiễu" chứa ≥2 âm contrast, vd father /ɑː/+ /ə/)
        const filteredPool = filterSinglePhonemeWords(poolWords, contrastPhonemes);
        if (filteredPool.length === 0) {
          console.warn(`   ⚠️  Pool rỗng sau lọc 1-âm cho ${sg.id}, listen_choose → DRAFT.`);
          await prisma.exercise.update({ where: { id: exerciseId }, data: { status: "DRAFT", questionCount: 0 } });
          continue;
        }

        // 4. Sinh 10 câu 3-stage (4 S1 + 4 S2 + 2 S3; pool <10 → lặp cycle)
        const questions3stage = buildListenChooseQuestions(filteredPool, contrastPhonemes);

        // Xóa câu listen_choose cũ của exercise (idempotent, thay thế word-mode cũ)
        await prisma.question.deleteMany({ where: { exerciseId } });

        let qIdx = 1;
        for (const q of questions3stage) {
          const questionId = generateQuestionId(exerciseId, qIdx);
          const contentJson = JSON.stringify({
            mode: "listen_choose",
            answerType: "phoneme",
            stage: q.stage,
            showIpa: q.showIpa,
            word: q.word,
            ipa: q.ipa,
            audioUrl: q.audioUrl,
            targetPhoneme: q.targetPhoneme,
            contrastPhonemes: q.contrastPhonemes,
            skeleton: q.skeleton,
          });

          await prisma.question.upsert({
            where: { id: questionId },
            update: {
              name: `Q${qIdx}`,
              content: contentJson,
              answer: q.answer, // = targetPhoneme (IPA y nguyên)
              score: 10,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-1-mc"].id,
            },
            create: {
              id: questionId,
              name: `Q${qIdx}`,
              content: contentJson,
              answer: q.answer,
              score: 10,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-1-mc"].id,
              exerciseId,
            },
          });

          // AnswerOption = contrastPhonemes (content = IPA y nguyên, cho scoring qua selectedOptionId)
          await prisma.answerOption.deleteMany({ where: { questionId } });
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
        console.log(`   ✓ ${sg.id} listen_choose: ${questions3stage.length} câu 3-stage`);
        continue; // skip nhánh bank cũ (word-mode) — unreachable cho listen_choose CĐ1-3
      }

      // === v2 CĐ4 Mode A (mode_a_listen_choose): sinh Question trực tiếp từ content (bypass bank) ===
      if (mode.id === "mode_a_listen_choose" && sg.topicId === "topic-4-stress-connected") {
        const cd4QtypeId = CD4_QTYPE_BY_GROUP[sg.id];
        if (!cd4QtypeId) {
          await prisma.exercise.update({ where: { id: exerciseId }, data: { status: "DRAFT", questionCount: 0 } });
          continue;
        }
        await prisma.question.deleteMany({ where: { exerciseId } }); // idempotent
        let qIdx = 1;

        if (sg.id === "map-t4-g01-word-stress") {
          // Word Stress: iterate words (có audio), tap-stress question
          for (const w of content.words) {
            const wordItem = await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } });
            if (!wordItem || wordItem.status !== "ACTIVE" || !wordItem.audioUrl) continue;
            const questionId = generateQuestionId(exerciseId, qIdx);
            const contentJson = JSON.stringify({
              mode: "mode_a_listen_choose",
              qtype: "tap-stress",
              word: w.word,
              ipa: w.ipa,
              syllables: w.syllables ?? [],
              stressIndex: w.stressIndex ?? 0,
              audioUrl: wordItem.audioUrl,
            });
            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer: String(w.stressIndex ?? 0), score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer: String(w.stressIndex ?? 0), score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id, exerciseId },
            });
            // AnswerOption = mỗi âm tiết (user bấm 1 — single select, scoring SP4)
            await prisma.answerOption.deleteMany({ where: { questionId } });
            const syls = w.syllables ?? [];
            for (let i = 0; i < syls.length; i++) {
              await prisma.answerOption.create({ data: { content: syls[i], questionId } });
            }
            qIdx++;
            totalQuestions++;
          }
        } else {
          // g02 weak / g03 linking / g04 assimilation: iterate sentences
          for (const s of content.sentences) {
            const questionId = generateQuestionId(exerciseId, qIdx);
            let contentJson: string;
            let answer: string;
            const options: string[] = [];

            if (sg.id === "map-t4-g02-weak-forms") {
              const weakWords = s.weakWords ?? [];
              contentJson = JSON.stringify({ mode: "mode_a_listen_choose", qtype: "choose-weak", sentence: s.sentence, ipa: s.ipa ?? "", weakWords, audioUrl: null });
              answer = weakWords.join(",");
              options.push(...s.sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean));
            } else if (sg.id === "map-t4-g03-linking") {
              const linkingPairs = s.linkingPairs ?? [];
              contentJson = JSON.stringify({ mode: "mode_a_listen_choose", qtype: "choose-linking", sentence: s.sentence, ipa: s.ipa ?? "", linkingPairs, audioUrl: null });
              answer = linkingPairs.map((p) => p.join("→")).join(",");
              const words = s.sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);
              for (let i = 0; i < words.length - 1; i++) options.push(`${words[i]}→${words[i + 1]}`);
            } else {
              // g04 assimilation
              contentJson = JSON.stringify({ mode: "mode_a_listen_choose", qtype: "choose-assimilation", sentence: s.sentence, ipa: s.ipa ?? "", assimilationType: s.assimilationType ?? "", original: s.assimOriginal ?? "", result: s.assimResult ?? "", audioUrl: null });
              answer = s.assimResult ?? "";
              options.push(s.assimResult ?? "", s.assimOriginal ?? "");
            }

            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer, score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer, score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id, exerciseId },
            });
            await prisma.answerOption.deleteMany({ where: { questionId } });
            for (const opt of options) {
              await prisma.answerOption.create({ data: { content: opt, questionId } });
            }
            qIdx++;
            totalQuestions++;
          }
        }

        const countA = qIdx - 1;
        await prisma.exercise.update({ where: { id: exerciseId }, data: { questionCount: countA, status: countA > 0 ? "ACTIVE" : "DRAFT" } });
        console.log(`   ✓ ${sg.id} mode_a: ${countA} câu`);
        continue; // skip nhánh bank — CĐ4 không qua QuestionBankItem
      }

      // === v2 CĐ4 Mode B (mode_b_speak_match): đọc từ/câu, acceptedAnswers multi (g02) ===
      if (mode.id === "mode_b_speak_match" && sg.topicId === "topic-4-stress-connected") {
        await prisma.question.deleteMany({ where: { exerciseId } }); // idempotent
        let qIdx = 1;

        if (sg.id === "map-t4-g01-word-stress") {
          // Đọc từ đúng trọng âm
          for (const w of content.words) {
            const wordItem = await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } });
            if (!wordItem) continue;
            const questionId = generateQuestionId(exerciseId, qIdx);
            const contentJson = JSON.stringify({
              mode: "mode_b_speak_match",
              word: w.word,
              ipa: w.ipa,
              syllables: w.syllables ?? [],
              stressIndex: w.stressIndex ?? 0,
              audioUrl: wordItem.audioUrl ?? null,
            });
            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer: w.word, score: 15, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, acceptedAnswers: Prisma.DbNull },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer: w.word, score: 15, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, exerciseId, acceptedAnswers: Prisma.DbNull },
            });
            qIdx++;
            totalQuestions++;
          }
        } else {
          // g02/3/4: đọc câu, acceptedAnswers multi (g02) hoặc đơn (g03/4 → null)
          for (const s of content.sentences) {
            const questionId = generateQuestionId(exerciseId, qIdx);
            const contentJson = JSON.stringify({
              mode: "mode_b_speak_match",
              sentence: s.sentence,
              ipa: s.ipa ?? "",
              acceptedAnswers: s.acceptedAnswers ?? undefined,
            });
            const accepted = s.acceptedAnswers && s.acceptedAnswers.length > 0
              ? JSON.parse(JSON.stringify(s.acceptedAnswers))
              : null;
            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer: s.sentence, score: 20, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, acceptedAnswers: accepted },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer: s.sentence, score: 20, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, exerciseId, acceptedAnswers: accepted },
            });
            qIdx++;
            totalQuestions++;
          }
        }

        const countB = qIdx - 1;
        await prisma.exercise.update({ where: { id: exerciseId }, data: { questionCount: countB, status: countB > 0 ? "ACTIVE" : "DRAFT" } });
        console.log(`   ✓ ${sg.id} mode_b: ${countB} câu`);
        continue; // skip nhánh bank
      }

      // Lấy QuestionBankItem ACTIVE của sound group + questionType tương ứng
      const bankItems = await prisma.questionBankItem.findMany({
        where: {
          soundGroupId: sg.id,
          questionTypeId: mode.questionTypeId,
          status: "ACTIVE",
        },
      });

      let questionIndex = 1;
      let createdForThisExercise = 0;

      for (const bank of bankItems) {
        const questionId = generateQuestionId(exerciseId, questionIndex);
        const bankContent = bank.contentJson as unknown as Record<string, unknown>;
        const bankMode = (bankContent.mode as string) ?? mode.id;

        // Fix trùng: speak_word + speak_sentence cùng qtype-2-voice (lesson-catalog.ts collision).
        // Bank items có mode field → chỉ ingest bank item khớp mode của exercise hiện tại,
        // tránh luyện miệng lẫn câu + thực chiến lẫn từ. listen_choose đã continue trước vòng lặp;
        // speak_minimal_pair dùng qtype-3-minimal-pairs riêng → không dính.
        if (bankMode !== mode.id) continue;

        // --- listen_choose: cần audio + distractor thật ---
        if (mode.id === "listen_choose") {
          const audioUrl = (bankContent.audioUrl as string) ?? null;
          if (!audioUrl) continue; // không có audio -> bỏ qua (quy tắc DATA_SEED_PLAN mục 7)

          const answerWord = bank.answer;
          const distractors = await buildDistractors(sg.id, answerWord, content.words, content.minimalPairs);
          // Nếu không đủ distractor thật -> bỏ qua câu này (đảm bảo chất lượng)
          if (distractors.length < 3) {
            console.warn(`   ⚠️  Không đủ distractor thật cho "${answerWord}" (${sg.id}), bỏ qua câu.`);
            continue;
          }

          // content JSON chuẩn cho ExerciseEngineClient.ListenChooseQuestion
          const options = [
            { id: `${questionId}-opt-correct`, text: answerWord },
            ...distractors.map((d, i) => ({ id: `${questionId}-opt-d${i}`, text: d })),
          ].sort(() => Math.random() - 0.5);

          const contentJson = JSON.stringify({
            word: answerWord,
            ipa: bankContent.ipa ?? undefined,
            audioUrl,
            hint: undefined,
            options,
          });

          await prisma.question.upsert({
            where: { id: questionId },
            update: {
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: answerWord,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-1-mc"].id,
            },
            create: {
              id: questionId,
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: answerWord,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-1-mc"].id,
              exerciseId,
            },
          });

          // Tạo AnswerOption rows (cho submit scoring qua selectedOptionId)
          // deleteMany trước để idempotent khi re-run seed
          await prisma.answerOption.deleteMany({ where: { questionId } });
          for (const opt of options) {
            await prisma.answerOption.create({
              data: { content: opt.text, questionId },
            });
          }

          questionIndex++;
          totalQuestions++;
          createdForThisExercise++;
          continue;
        }

        // --- speak_word ---
        if (mode.id === "speak_word") {
          const contentJson = JSON.stringify({
            word: bankContent.word,
            ipa: bankContent.ipa ?? undefined,
            audioUrl: bankContent.audioUrl ?? undefined,
            hint: bankContent.hint ?? undefined,
          });

          await prisma.question.upsert({
            where: { id: questionId },
            update: {
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: bank.answer,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-2-voice"].id,
            },
            create: {
              id: questionId,
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: bank.answer,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-2-voice"].id,
              exerciseId,
            },
          });

          questionIndex++;
          totalQuestions++;
          createdForThisExercise++;
          continue;
        }

        // --- speak_minimal_pair ---
        if (mode.id === "speak_minimal_pair") {
          // bank.contentJson là mảng 2 phần tử [{word,ipa,audioUrl,hint}, {word,ipa,audioUrl}]
          const contentJson = JSON.stringify(bankContent);

          await prisma.question.upsert({
            where: { id: questionId },
            update: {
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: bank.answer,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-3-minimal-pairs"].id,
            },
            create: {
              id: questionId,
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: bank.answer,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-3-minimal-pairs"].id,
              exerciseId,
            },
          });

          questionIndex++;
          totalQuestions++;
          createdForThisExercise++;
          continue;
        }

        // --- speak_sentence (dùng qtype-2-voice + mode trong content) ---
        if (mode.id === "speak_sentence") {
          const sentence = (bankContent.sentence as string) ?? bank.answer;
          const contentJson = JSON.stringify({
            mode: "speak_sentence",
            word: sentence, // VoiceQuestion dùng contentData.word cho fallback, nhưng sentence mode dùng question.answer
            ipa: (bankContent.ipa as string) ?? undefined,
            audioUrl: bankContent.audioUrl ?? undefined,
            hint: bankContent.hint ?? undefined,
          });

          await prisma.question.upsert({
            where: { id: questionId },
            update: {
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: sentence,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-2-voice"].id,
            },
            create: {
              id: questionId,
              name: `Q${questionIndex}`,
              content: contentJson,
              answer: sentence,
              score: bank.score,
              status: "ACTIVE",
              typeId: qtypeMap["qtype-2-voice"].id,
              exerciseId,
            },
          });

          questionIndex++;
          totalQuestions++;
          createdForThisExercise++;
          continue;
        }
      }

      // Cập nhật questionCount cho exercise
      await prisma.exercise.update({
        where: { id: exerciseId },
        data: { questionCount: createdForThisExercise },
      });

      // Exercise không có câu hỏi ACTIVE nào -> chuyển DRAFT (tránh bài ACTIVE nhưng rỗng)
      if (createdForThisExercise === 0) {
        await prisma.exercise.update({
          where: { id: exerciseId },
          data: { status: "DRAFT" },
        });
      }
    }
  }

  console.log(`   ✓ ${totalQuestions} Questions generated từ QuestionBankItem (distractor thật)`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🌱 Starting lesson seed (bản sửa lỗi 18/06/2026)...\n");

  try {
    await seedQuestionTypes();
    await seedTopics();
    await seedPhonemes();
    await seedSoundGroups();
    await seedLessonContent();
    await seedQuestionBankItems(); // KHO NGUỒN
    await generateLearningMaps();
    await generateExercises(); // topicId đúng
    await generateQuestions(); // sinh từ kho, distractor thật

    console.log("\n✅ Lesson seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${TOPICS.length} Topics (chỉ 4 chủ đề)`);
    console.log(`   - ${PHONEMES.length} Phonemes`);
    console.log(`   - ${SOUND_GROUPS.length} Sound Groups`);
    console.log(`   - ${SOUND_GROUPS.length} Learning Maps`);
    console.log(`   - ${SOUND_GROUPS.length * EXERCISE_MODES.length} Exercises (topicId gán đúng)`);
    console.log(`   - QuestionBankItem: kho nguồn đã được tạo`);
    console.log(`   - Audio: fetch thật từ Free Dictionary API cho từ FREE_API`);
  } catch (error) {
    console.error("❌ Error during seed:", error);
    throw error;
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
