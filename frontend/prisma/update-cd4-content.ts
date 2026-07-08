/**
 * UPDATE CD4 CONTENT - Cập nhật nội dung Weak Forms, Linking, Assimilation
 * từ các nguồn đáng tin cậy: Oxford Online English, Baruch College CUNY
 *
 * Chạy: npx tsx prisma/update-cd4-content.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// WEAK FORMS - Nguồn: Oxford Online English
// https://www.oxfordonlineenglish.com/weak-forms-english
// ============================================================================

const WEAK_FORMS_SENTENCES = [
  {
    sentence: "Are you coming to the cinema with us tomorrow?",
    targetWords: ["are", "you", "to", "the", "us"],
    weakWords: ["are", "you", "to", "the", "us"],
    ipa: "/ɑːr jə ˈkʌmɪŋ tə ðə ˈsɪnəmə wɪð əs təˈmɒrəʊ/",
    translation: "Bạn có đến rạp phim với bọn tôi tối mai không?",
    difficulty: 6,
    reviewNote: "Oxford: are→/ə/, you→/jə/, to→/tə/, the→/ðə/, us→/əs/",
  },
  {
    sentence: "What does he do at the weekends?",
    targetWords: ["does", "at", "the"],
    weakWords: ["does", "at", "the"],
    ipa: "/wɒt dəz hiː duː ət ðə ˈwiːkɛndz/",
    translation: "Anh ấy làm gì vào cuối tuần?",
    difficulty: 5,
    reviewNote: "Oxford: does→/dəz/, at→/ət/, the→/ðə/; 'do' is main verb = strong",
  },
  {
    sentence: "How long have you been waiting here?",
    targetWords: ["have", "you"],
    weakWords: ["have", "you"],
    ipa: "/haʊ lɒŋ əv jə biːn ˈweɪtɪŋ hɪə/",
    translation: "Bạn đã đợi ở đây bao lâu rồi?",
    difficulty: 5,
    reviewNote: "Oxford: have+you→/əvjə/ contracted; 'been' no weak form",
  },
  {
    sentence: "I could have done more if I'd had more time.",
    targetWords: ["could", "have"],
    weakWords: ["could", "have"],
    ipa: "/aɪ kədəv dʌn mɔːr ɪf aɪd hæd mɔːr taɪm/",
    translation: "Tôi có thể đã làm nhiều hơn nếu có thêm thời gian.",
    difficulty: 6,
    reviewNote: "Oxford: could+have→/kədəv/; 'I'd' = weak form of 'I had'",
  },
  {
    sentence: "Does she really think she should do it?",
    targetWords: ["does", "should"],
    weakWords: ["does", "should"],
    ipa: "/dəzʃiː ˈrɪəli θɪŋkʃiːʃəd duː ɪt/",
    translation: "Cô ấy có thật sự nghĩ rằng mình nên làm không?",
    difficulty: 6,
    reviewNote: "Oxford: does→/dəz/, should→/ʃəd/; linked to next word",
  },
  {
    sentence: "What did you do to your hair?",
    targetWords: ["to", "your"],
    weakWords: ["to", "your"],
    ipa: "/wɒt dɪdʒə duː tə jɔː hɛə/",
    translation: "Bạn đã làm gì với tóc vậy?",
    difficulty: 5,
    reviewNote: "Oxford: to→/tə/, your→/jɔː/ weak; 'you' can also be /jə/",
  },
  {
    sentence: "She can do it, just give her time.",
    targetWords: ["can", "her"],
    weakWords: ["can", "her"],
    ipa: "/ʃiː kən duː ɪt dʒʌst gɪv hə taɪm/",
    translation: "Cô ấy có thể làm được, chỉ cần cho cô ấy thời gian.",
    difficulty: 5,
    reviewNote: "Oxford: can→/kən/, her→/hə/ weak in unstressed position",
  },
  {
    sentence: "I want to give you something.",
    targetWords: ["to", "you"],
    weakWords: ["to", "you"],
    ipa: "/aɪ wɒnə gɪv jə ˈsʌmθɪŋ/",
    translation: "Tôi muốn cho bạn một thứ gì đó.",
    difficulty: 4,
    reviewNote: "Oxford: want+to→wanna /wɒnə/, you→/jə/ weak",
  },
];

// ============================================================================
// LINKING - Nguồn: Oxford Online English
// https://www.oxfordonlineenglish.com/linking-pronunciation
// ============================================================================

const LINKING_SENTENCES = [
  // C+V Linking (Consonant + Vowel)
  {
    sentence: "There's an elephant in the garden.",
    targetWords: ["There's", "an", "elephant", "in"],
    linkingPairs: [["There's", "an"], ["an", "elephant"], ["elephant", "in"]],
    ipa: "/ðɛərz_ən_ɛlɪfənt_ɪn ðə ˈɡɑːdn/",
    translation: "Có một con voi trong vườn.",
    difficulty: 5,
    reviewNote: "Oxford C+V linking: consonant joins to following vowel",
  },
  {
    sentence: "I ate an apple and two pears.",
    targetWords: ["ate", "an", "apple", "and"],
    linkingPairs: [["ate", "an"], ["an", "apple"], ["apple", "and"]],
    ipa: "/aɪ eɪt_ən_æpəl_ənd tuː pɛəz/",
    translation: "Tôi ăn một quả táo và hai quả lê.",
    difficulty: 5,
    reviewNote: "Oxford C+V linking: /t/+/ə/, /n/+/æ/, /l/+/ə/",
  },
  {
    sentence: "Turn off the light.",
    targetWords: ["Turn", "off"],
    linkingPairs: [["Turn", "off"]],
    ipa: "/tɜːrn_ɒf ðə laɪt/",
    translation: "Tắt đèn.",
    difficulty: 4,
    reviewNote: "Oxford C+V linking: /n/+/ɒ/",
  },
  {
    sentence: "Pick it up.",
    targetWords: ["Pick", "it", "up"],
    linkingPairs: [["Pick", "it"], ["it", "up"]],
    ipa: "/pɪk_ɪt_ʌp/",
    translation: "Nhấc nó lên.",
    difficulty: 4,
    reviewNote: "Oxford C+V linking: /k/+/ɪ/, /t/+/ʌ/",
  },
  // C+C Linking (Consonant + Consonant - same sound)
  {
    sentence: "She bought a really nice red dress last week.",
    targetWords: ["red", "dress"],
    linkingPairs: [["red", "dress"]],
    ipa: "/ʃiː bɔːt ə ˈrɪəli naɪs red_dres lɑːst wiːk/",
    translation: "Cô ấy mua một chiếc váy đỏ thật đẹp tuần trước.",
    difficulty: 5,
    reviewNote: "Oxford C+C linking: /d/+/d/ shared sound",
  },
  {
    sentence: "Do you know any cheap places to stay in Barcelona?",
    targetWords: ["cheap", "places"],
    linkingPairs: [["cheap", "places"]],
    ipa: "/duː jə nəʊ ˈɛni tʃiːp_pleɪsɪz tə steɪ ɪn bɑːsɪlənə/",
    translation: "Bạn có biết chỗ rẻ nào để ở Barcelona không?",
    difficulty: 6,
    reviewNote: "Oxford C+C linking: /p/+/p/ shared sound",
  },
  {
    sentence: "I feel lucky today.",
    targetWords: ["feel", "lucky"],
    linkingPairs: [["feel", "lucky"]],
    ipa: "/aɪ fiːl_lʌki təˈdeɪ/",
    translation: "Tôi cảm thấy may mắn hôm nay.",
    difficulty: 4,
    reviewNote: "Oxford C+C linking: /l/+/l/ shared sound",
  },
  // V+V Linking (Vowel + Vowel - add /j/ or /w/)
  {
    sentence: "He asked me for two apples.",
    targetWords: ["he", "asked", "two", "apples"],
    linkingPairs: [["he", "asked"], ["two", "apples"]],
    ipa: "/hiː_j/ɑːskt miː fɔː tuː_w/æpəlz/",
    translation: "Anh ấy hỏi tôi hai quả táo.",
    difficulty: 6,
    reviewNote: "Oxford V+V linking: he~/j/~asked, two~/w/~apples",
  },
  {
    sentence: "I'm going to see Andrew this weekend.",
    targetWords: ["see", "Andrew"],
    linkingPairs: [["see", "Andrew"]],
    ipa: "/aɪm ˈɡoʊɪŋ tə siː_j/ˈændruː ðɪs ˈwiːkɛnd/",
    translation: "Tôi sẽ gặp Andrew cuối tuần này.",
    difficulty: 5,
    reviewNote: "Oxford V+V linking: /iː/+/æ/ → add /j/",
  },
];

// ============================================================================
// ASSIMILATION - Nguồn: Baruch College CUNY
// https://tfcs.baruch.cuny.edu/assimilation
// ============================================================================

const ASSIMILATION_SENTENCES = [
  // /d/ + /y/ = /dʒ/
  {
    sentence: "Would you like to come in?",
    targetWords: ["Would", "you"],
    assimilationType: "dj→dʒ",
    assimOriginal: "would you",
    assimResult: "wʊdʒu laɪk tə kʌm ɪn",
    ipa: "/wʊdʒu laɪk tə kʌm ɪn/",
    translation: "Bạn có muốn vào không?",
    difficulty: 5,
    reviewNote: "Baruch: /d/+/j/→/dʒ/ palatalization",
  },
  {
    sentence: "Had you ever been there before?",
    targetWords: ["Had", "you"],
    assimilationType: "dj→dʒ",
    assimOriginal: "had you",
    assimResult: "hædʒu ˈɛvər biːn ðɛər bɪˈfɔːr",
    ipa: "/hædʒu ˈɛvər biːn ðɛər bɪˈfɔːr/",
    translation: "Bạn đã từng ở đó bao giờ chưa?",
    difficulty: 5,
    reviewNote: "Baruch: /d/+/j/→/dʒ/",
  },
  {
    sentence: "What did you do last weekend?",
    targetWords: ["did", "you"],
    assimilationType: "dj→dʒ",
    assimOriginal: "did you",
    assimResult: "wɒt dɪdʒə duː lɑːst ˈwiːkɛnd",
    ipa: "/wɒt dɪdʒə duː lɑːst ˈwiːkɛnd/",
    translation: "Bạn đã làm gì cuối tuần trước?",
    difficulty: 4,
    reviewNote: "Baruch: /d/+/j/→/dʒ/; 'you' reduced to /jə/",
  },
  // /t/ + /y/ = /tʃ/
  {
    sentence: "I'll beat you there!",
    targetWords: ["beat", "you"],
    assimilationType: "tj→tʃ",
    assimOriginal: "beat you",
    assimResult: "aɪl biːtʃu ðɛər",
    ipa: "/aɪl biːtʃu ðɛər/",
    translation: "Tôi sẽ đến那里 trước bạn!",
    difficulty: 5,
    reviewNote: "Baruch: /t/+/j/→/tʃ/ palatalization",
  },
  {
    sentence: "What's your name?",
    targetWords: ["What's", "your"],
    assimilationType: "tsj→tʃ",
    assimOriginal: "what's your",
    assimResult: "wɒtʃər neɪm",
    ipa: "/wɒtʃər neɪm/",
    translation: "Tên bạn là gì?",
    difficulty: 4,
    reviewNote: "Baruch: /ts/+/j/→/tʃ/",
  },
  {
    sentence: "I met you yesterday.",
    targetWords: ["met", "you"],
    assimilationType: "tj→tʃ",
    assimOriginal: "met you",
    assimResult: "aɪ mɛtʃu ˈjɛstədeɪ",
    ipa: "/aɪ mɛtʃu ˈjɛstədeɪ/",
    translation: "Tôi đã gặp bạn hôm qua.",
    difficulty: 4,
    reviewNote: "Baruch: /t/+/j/→/tʃ/",
  },
  // /z/ + /y/ = /ʒ/
  {
    sentence: "Is your train on time?",
    targetWords: ["Is", "your"],
    assimilationType: "zy→ʒ",
    assimOriginal: "is your",
    assimResult: "ɪʒər treɪn ɒn taɪm",
    ipa: "/ɪʒər treɪn ɒn taɪm/",
    translation: "Chuyến tàu của bạn có đúng giờ không?",
    difficulty: 5,
    reviewNote: "Baruch: /z/+/j/→/ʒ/",
  },
  {
    sentence: "Does your roommate cook?",
    targetWords: ["Does", "your"],
    assimilationType: "zy→ʒ",
    assimOriginal: "does your",
    assimResult: "dʌʒər ˈruːmmeɪt kʊk",
    ipa: "/dʌʒər ˈruːmmeɪt kʊk/",
    translation: "Bạn cùng phòng của bạn có nấu ăn không?",
    difficulty: 5,
    reviewNote: "Baruch: /z/+/j/→/ʒ/",
  },
  // /s/ + /y/ = /ʃ/
  {
    sentence: "Don't miss your train!",
    targetWords: ["miss", "your"],
    assimilationType: "sy→ʃ",
    assimOriginal: "miss your",
    assimResult: "doʊnt mɪʃər treɪn",
    ipa: "/doʊnt mɪʃər treɪn/",
    translation: "Đừng lỡ chuyến tàu của bạn!",
    difficulty: 4,
    reviewNote: "Baruch: /s/+/j/→/ʃ/",
  },
];

async function updateCD4Content() {
  console.log("🔄 Updating CD4 content from reliable sources...\n");

  // 1. Update Weak Forms sentences
  console.log("📝 Updating Weak Forms sentences (Oxford Online English)...");
  const weakFormsMapId = "map-t4-g02-weak-forms";

  // Delete old sentences
  await prisma.sentenceItem.deleteMany({
    where: { soundGroupId: weakFormsMapId },
  });
  console.log("   ✓ Deleted old Weak Forms sentences");

  // Insert new sentences
  for (const sentence of WEAK_FORMS_SENTENCES) {
    await prisma.sentenceItem.create({
      data: {
        text: sentence.sentence,
        soundGroupId: weakFormsMapId,
        targetWords: sentence.targetWords,
        difficulty: sentence.difficulty <= 4 ? "EASY" : sentence.difficulty <= 5 ? "MEDIUM" : "HARD",
        status: "ACTIVE",
        sourceType: "MANUAL",
        reviewNote: sentence.reviewNote,
      },
    });
  }
  console.log(`   ✓ Inserted ${WEAK_FORMS_SENTENCES.length} Weak Forms sentences`);

  // 2. Update Linking sentences
  console.log("\n📝 Updating Linking sentences (Oxford Online English)...");
  const linkingMapId = "map-t4-g03-linking";

  // Delete old sentences
  await prisma.sentenceItem.deleteMany({
    where: { soundGroupId: linkingMapId },
  });
  console.log("   ✓ Deleted old Linking sentences");

  // Insert new sentences
  for (const sentence of LINKING_SENTENCES) {
    await prisma.sentenceItem.create({
      data: {
        text: sentence.sentence,
        soundGroupId: linkingMapId,
        targetWords: sentence.targetWords,
        difficulty: sentence.difficulty <= 4 ? "EASY" : sentence.difficulty <= 5 ? "MEDIUM" : "HARD",
        status: "ACTIVE",
        sourceType: "MANUAL",
        reviewNote: sentence.reviewNote,
      },
    });
  }
  console.log(`   ✓ Inserted ${LINKING_SENTENCES.length} Linking sentences`);

  // 3. Update Assimilation sentences
  console.log("\n📝 Updating Assimilation sentences (Baruch College CUNY)...");
  const assimMapId = "map-t4-g04-assimilation";

  // Delete old sentences
  await prisma.sentenceItem.deleteMany({
    where: { soundGroupId: assimMapId },
  });
  console.log("   ✓ Deleted old Assimilation sentences");

  // Insert new sentences
  for (const sentence of ASSIMILATION_SENTENCES) {
    await prisma.sentenceItem.create({
      data: {
        text: sentence.sentence,
        soundGroupId: assimMapId,
        targetWords: sentence.targetWords,
        difficulty: sentence.difficulty <= 4 ? "EASY" : sentence.difficulty <= 5 ? "MEDIUM" : "HARD",
        status: "ACTIVE",
        sourceType: "MANUAL",
        reviewNote: sentence.reviewNote,
      },
    });
  }
  console.log(`   ✓ Inserted ${ASSIMILATION_SENTENCES.length} Assimilation sentences`);

  console.log("\n✅ CD4 content update completed!");
  console.log(`   - Weak Forms: ${WEAK_FORMS_SENTENCES.length} sentences (Oxford)`);
  console.log(`   - Linking: ${LINKING_SENTENCES.length} sentences (Oxford)`);
  console.log(`   - Assimilation: ${ASSIMILATION_SENTENCES.length} sentences (Baruch)`);
}

updateCD4Content()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
