/**
 * LESSON CONTENT - Dữ liệu thực tế cho bài học
 * 
 * MVP: 20 bài (8 bài chủ đề 1 + 12 bài chủ đề 4)
 * - Chủ đề 1: Nhóm /iː/ & /ɪ/ (4 bài) + Nhóm /e/ & /æ/ (4 bài) + Nhóm /ɒ/ & /ɔː/ (4 bài)
 * - Chủ đề 4: Nhóm front vowels (4 bài) + Nhóm final consonants (4 bài)
 * 
 * Mỗi item có:
 * - status: ACTIVE (có audio/review), DRAFT (chưa đủ), NEEDS_REVIEW
 * - sourceType: MANUAL (tự biên soạn), FREE_API (Free Dictionary)
 * - reviewNote: ghi chú về nguồn/chất lượng
 */

export type WordItemData = {
  word: string;
  ipa: string;
  soundGroupId: string;
  targetPhonemes: string[];
  difficulty: number;
  audioUrl?: string;
  exampleSentence?: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS_REVIEW";
  sourceType: "MANUAL" | "FREE_API" | "LICENSED";
  sourceUrl?: string;
  reviewNote?: string;
  // v2 CĐ4: cho Word Stress (UI tap-stress). Lưu DB WordItem (schema đã có cột).
  syllables?: string[];
  stressIndex?: number;
  wordStressType?: "WORD_STRESS" | "WEAK_FORM" | "LINKING" | "ASSIMILATION";
};

export type MinimalPairData = {
  word1: string;
  ipa1: string;
  word2: string;
  ipa2: string;
  soundGroupId: string;
  contrastPhonemes: string[];
  difficulty: number;
  audioUrl1?: string;
  audioUrl2?: string;
  explanation?: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS_REVIEW";
  sourceType: "MANUAL" | "FREE_API" | "LICENSED";
  reviewNote?: string;
};

export type SentenceItemData = {
  sentence: string;
  soundGroupId: string;
  targetWords: string[];
  targetPhonemes: string[];
  difficulty: number;
  ipa?: string;
  audioUrl?: string;
  translation?: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS_REVIEW";
  sourceType: "MANUAL" | "FREE_API" | "LICENSED";
  reviewNote?: string;
  // v2 CĐ4: authoring field (KHÔNG lưu DB SentenceItem — seed build Question.contentJson từ đây)
  weakWords?: string[];
  linkingPairs?: string[][];
  assimilationType?: string;
  assimOriginal?: string;
  assimResult?: string;
  acceptedAnswers?: string[];
};

// ============================================================================
// TOPIC 1 - NHÓM 1: /iː/ & /ɪ/ (ship/sheep)
// ============================================================================

export const WORDS_T1_G01_I_IH: WordItemData[] = [
  {
    word: "sheep",
    ipa: "/ʃiːp/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/iː/"],
    difficulty: 3,
    exampleSentence: "The sheep are in the field.",
    status: "ACTIVE",
    sourceType: "FREE_API",
    sourceUrl: "https://api.dictionaryapi.dev/api/v2/entries/en/sheep",
    reviewNote: "Audio từ Free Dictionary API, quality tốt",
  },
  {
    word: "ship",
    ipa: "/ʃɪp/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/ɪ/"],
    difficulty: 3,
    exampleSentence: "The ship sailed across the ocean.",
    status: "ACTIVE",
    sourceType: "FREE_API",
    sourceUrl: "https://api.dictionaryapi.dev/api/v2/entries/en/ship",
    reviewNote: "Audio từ Free Dictionary API",
  },
  {
    word: "feel",
    ipa: "/fiːl/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/iː/"],
    difficulty: 2,
    exampleSentence: "I feel happy today.",
    status: "ACTIVE",
    sourceType: "FREE_API",
    reviewNote: "Từ cơ bản, dễ phát âm",
  },
  {
    word: "fill",
    ipa: "/fɪl/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/ɪ/"],
    difficulty: 2,
    exampleSentence: "Please fill the glass with water.",
    status: "ACTIVE",
    sourceType: "FREE_API",
    reviewNote: "Cặp minimal pair với feel",
  },
  {
    word: "seat",
    ipa: "/siːt/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/iː/"],
    difficulty: 2,
    exampleSentence: "Please take a seat.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "sit",
    ipa: "/sɪt/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/ɪ/"],
    difficulty: 2,
    exampleSentence: "Please sit down.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "heat",
    ipa: "/hiːt/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/iː/"],
    difficulty: 3,
    exampleSentence: "The heat is unbearable today.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "hit",
    ipa: "/hɪt/",
    soundGroupId: "map-t1-g01-i-ih",
    targetPhonemes: ["/ɪ/"],
    difficulty: 3,
    exampleSentence: "Don't hit the ball too hard.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
];

export const MINIMAL_PAIRS_T1_G01: MinimalPairData[] = [
  {
    word1: "sheep",
    ipa1: "/ʃiːp/",
    word2: "ship",
    ipa2: "/ʃɪp/",
    soundGroupId: "map-t1-g01-i-ih",
    contrastPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 3,
    explanation: "/iː/ dài và căng, /ɪ/ ngắn và lỏng",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Cặp cổ điển nhất cho /iː/ vs /ɪ/",
  },
  {
    word1: "feel",
    ipa1: "/fiːl/",
    word2: "fill",
    ipa2: "/fɪl/",
    soundGroupId: "map-t1-g01-i-ih",
    contrastPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 2,
    explanation: "Chú ý độ dài của nguyên âm",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "seat",
    ipa1: "/siːt/",
    word2: "sit",
    ipa2: "/sɪt/",
    soundGroupId: "map-t1-g01-i-ih",
    contrastPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 2,
    explanation: "Âm dài vs âm ngắn rõ nhất",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "heat",
    ipa1: "/hiːt/",
    word2: "hit",
    ipa2: "/hɪt/",
    soundGroupId: "map-t1-g01-i-ih",
    contrastPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 3,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const SENTENCES_T1_G01: SentenceItemData[] = [
  {
    sentence: "The sheep are on the ship.",
    soundGroupId: "map-t1-g01-i-ih",
    targetWords: ["sheep", "ship"],
    targetPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 4,
    ipa: "/ðə ʃiːp ɑːr ɒn ðə ʃɪp/",
    translation: "Những con cừu ở trên con tàu.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Câu chứa cả 2 âm mục tiêu",
  },
  {
    sentence: "I feel sick when I sit here.",
    soundGroupId: "map-t1-g01-i-ih",
    targetWords: ["feel", "sick", "sit"],
    targetPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 5,
    ipa: "/aɪ fiːl sɪk wɛn aɪ sɪt hɪə/",
    translation: "Tôi cảm thấy ốm khi ngồi ở đây.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "Please take your seat and sit down.",
    soundGroupId: "map-t1-g01-i-ih",
    targetWords: ["seat", "sit"],
    targetPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 4,
    ipa: "/pliːz teɪk jɔːr siːt ənd sɪt daʊn/",
    translation: "Xin hãy lấy chỗ ngồi và ngồi xuống.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "The heat will hit us soon.",
    soundGroupId: "map-t1-g01-i-ih",
    targetWords: ["heat", "hit"],
    targetPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 4,
    ipa: "/ðə hiːt wɪl hɪt ʌs suːn/",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

// ============================================================================
// TOPIC 1 - NHÓM 2: /e/ & /æ/ (bed/bad)
// ============================================================================

export const WORDS_T1_G02_E_AE: WordItemData[] = [
  {
    word: "bed",
    ipa: "/bed/",
    soundGroupId: "map-t1-g02-e-ae",
    targetPhonemes: ["/e/"],
    difficulty: 2,
    exampleSentence: "I go to bed at 10 PM.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "bad",
    ipa: "/bæd/",
    soundGroupId: "map-t1-g02-e-ae",
    targetPhonemes: ["/æ/"],
    difficulty: 3,
    exampleSentence: "That's a bad idea.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "pen",
    ipa: "/pen/",
    soundGroupId: "map-t1-g02-e-ae",
    targetPhonemes: ["/e/"],
    difficulty: 2,
    exampleSentence: "I need a pen to write.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "pan",
    ipa: "/pæn/",
    soundGroupId: "map-t1-g02-e-ae",
    targetPhonemes: ["/æ/"],
    difficulty: 3,
    exampleSentence: "Heat the pan before cooking.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "set",
    ipa: "/set/",
    soundGroupId: "map-t1-g02-e-ae",
    targetPhonemes: ["/e/"],
    difficulty: 2,
    exampleSentence: "Set the table for dinner.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "sat",
    ipa: "/sæt/",
    soundGroupId: "map-t1-g02-e-ae",
    targetPhonemes: ["/æ/"],
    difficulty: 3,
    exampleSentence: "She sat on the chair.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
];

export const MINIMAL_PAIRS_T1_G02: MinimalPairData[] = [
  {
    word1: "bed",
    ipa1: "/bed/",
    word2: "bad",
    ipa2: "/bæd/",
    soundGroupId: "map-t1-g02-e-ae",
    contrastPhonemes: ["/e/", "/æ/"],
    difficulty: 3,
    explanation: "/e/ hẹp hơn, /æ/ mở miệng rộng hơn",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "pen",
    ipa1: "/pen/",
    word2: "pan",
    ipa2: "/pæn/",
    soundGroupId: "map-t1-g02-e-ae",
    contrastPhonemes: ["/e/", "/æ/"],
    difficulty: 3,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "set",
    ipa1: "/set/",
    word2: "sat",
    ipa2: "/sæt/",
    soundGroupId: "map-t1-g02-e-ae",
    contrastPhonemes: ["/e/", "/æ/"],
    difficulty: 3,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const SENTENCES_T1_G02: SentenceItemData[] = [
  {
    sentence: "The bad man is in bed.",
    soundGroupId: "map-t1-g02-e-ae",
    targetWords: ["bad", "bed"],
    targetPhonemes: ["/æ/", "/e/"],
    difficulty: 4,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "I left my pen in the pan.",
    soundGroupId: "map-t1-g02-e-ae",
    targetWords: ["pen", "pan"],
    targetPhonemes: ["/e/", "/æ/"],
    difficulty: 4,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "She set the bag down and sat.",
    soundGroupId: "map-t1-g02-e-ae",
    targetWords: ["set", "bag", "sat"],
    targetPhonemes: ["/e/", "/æ/"],
    difficulty: 5,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

// ============================================================================
// TOPIC 1 - NHÓM 4: /ɒ/ & /ɔː/ (hot/bought) - MINIMAL PAIRS KHÓ
// ============================================================================

export const WORDS_T1_G04_O_OH: WordItemData[] = [
  {
    word: "hot",
    ipa: "/hɒt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɒ/"],
    difficulty: 6,
    exampleSentence: "The coffee is too hot.",
    status: "ACTIVE",
    sourceType: "FREE_API",
    reviewNote: "Âm /ɒ/ ngắn, miệng mở tròn",
  },
  {
    word: "caught",
    ipa: "/kɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɔː/"],
    difficulty: 7,
    exampleSentence: "I caught the ball.",
    status: "ACTIVE",
    sourceType: "FREE_API",
    reviewNote: "Âm /ɔː/ dài hơn, môi tròn hơn",
  },
  {
    word: "not",
    ipa: "/nɒt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɒ/"],
    difficulty: 5,
    exampleSentence: "I'm not ready yet.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "nought",
    ipa: "/nɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɔː/"],
    difficulty: 7,
    exampleSentence: "Two plus nought equals two.",
    status: "ACTIVE",
    sourceType: "FREE_API",
    reviewNote: "Từ British English cho số 0",
  },
  {
    word: "spot",
    ipa: "/spɒt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɒ/"],
    difficulty: 6,
    exampleSentence: "I found a good parking spot.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "sport",
    ipa: "/spɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɔː/"],
    difficulty: 6,
    exampleSentence: "Football is my favorite sport.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "shot",
    ipa: "/ʃɒt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɒ/"],
    difficulty: 6,
    exampleSentence: "The doctor gave me a shot.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "short",
    ipa: "/ʃɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    targetPhonemes: ["/ɔː/"],
    difficulty: 6,
    exampleSentence: "She has short hair.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
];

export const MINIMAL_PAIRS_T1_G04: MinimalPairData[] = [
  {
    word1: "hot",
    ipa1: "/hɒt/",
    word2: "taught",
    ipa2: "/tɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    contrastPhonemes: ["/ɒ/", "/ɔː/"],
    difficulty: 7,
    explanation: "/ɒ/ ngắn và mở, /ɔː/ dài và tròn môi",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Cặp khó vì người Việt hay nhầm 2 âm này",
  },
  {
    word1: "not",
    ipa1: "/nɒt/",
    word2: "nought",
    ipa2: "/nɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    contrastPhonemes: ["/ɒ/", "/ɔː/"],
    difficulty: 8,
    explanation: "Chú ý độ dài và hình dạng môi",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "spot",
    ipa1: "/spɒt/",
    word2: "sport",
    ipa2: "/spɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    contrastPhonemes: ["/ɒ/", "/ɔː/"],
    difficulty: 7,
    explanation: "Âm /ɔː/ cần thêm /r/ trong phát âm Mỹ",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "shot",
    ipa1: "/ʃɒt/",
    word2: "short",
    ipa2: "/ʃɔːt/",
    soundGroupId: "map-t1-g04-o-oh",
    contrastPhonemes: ["/ɒ/", "/ɔː/"],
    difficulty: 7,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const SENTENCES_T1_G04: SentenceItemData[] = [
  {
    sentence: "The hot spot in the sport center.",
    soundGroupId: "map-t1-g04-o-oh",
    targetWords: ["hot", "spot", "sport"],
    targetPhonemes: ["/ɒ/", "/ɔː/"],
    difficulty: 8,
    translation: "Điểm nóng ở trung tâm thể thao.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "I'm not good at sport.",
    soundGroupId: "map-t1-g04-o-oh",
    targetWords: ["not", "sport"],
    targetPhonemes: ["/ɒ/", "/ɔː/"],
    difficulty: 7,
    translation: "Tôi không giỏi thể thao.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "She shot the ball but it was too short.",
    soundGroupId: "map-t1-g04-o-oh",
    targetWords: ["shot", "short"],
    targetPhonemes: ["/ɒ/", "/ɔː/"],
    difficulty: 8,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

// ============================================================================
// TOPIC 4 - NHÓM 1: Front vowels mix (sheep/ship/shape/sharp)
// ============================================================================

export const WORDS_T4_G01_FRONT_MIX: WordItemData[] = [
  {
    word: "sheep",
    ipa: "/ʃiːp/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/iː/"],
    difficulty: 6,
    exampleSentence: "Look at those sheep on the hill.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "ship",
    ipa: "/ʃɪp/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/ɪ/"],
    difficulty: 6,
    exampleSentence: "The ship is leaving the port.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "shape",
    ipa: "/ʃeɪp/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/eɪ/"],
    difficulty: 7,
    exampleSentence: "What shape is this object?",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "sharp",
    ipa: "/ʃɑːp/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/ɑː/"],
    difficulty: 7,
    exampleSentence: "Be careful, the knife is sharp.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "beat",
    ipa: "/biːt/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/iː/"],
    difficulty: 6,
    exampleSentence: "Don't beat the drum too loud.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "bit",
    ipa: "/bɪt/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/ɪ/"],
    difficulty: 6,
    exampleSentence: "I ate a bit of cake.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "bet",
    ipa: "/bet/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/e/"],
    difficulty: 6,
    exampleSentence: "I bet you can't do it.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "bat",
    ipa: "/bæt/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetPhonemes: ["/æ/"],
    difficulty: 6,
    exampleSentence: "He hit the ball with a bat.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
];

export const MINIMAL_PAIRS_T4_G01: MinimalPairData[] = [
  {
    word1: "sheep",
    ipa1: "/ʃiːp/",
    word2: "ship",
    ipa2: "/ʃɪp/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    contrastPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 7,
    explanation: "Tổng hợp: 4 nguyên âm phía trước khác nhau",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "beat",
    ipa1: "/biːt/",
    word2: "bit",
    ipa2: "/bɪt/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    contrastPhonemes: ["/iː/", "/ɪ/"],
    difficulty: 7,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "bit",
    ipa1: "/bɪt/",
    word2: "bet",
    ipa2: "/bet/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    contrastPhonemes: ["/ɪ/", "/e/"],
    difficulty: 7,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "bet",
    ipa1: "/bet/",
    word2: "bat",
    ipa2: "/bæt/",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    contrastPhonemes: ["/e/", "/æ/"],
    difficulty: 7,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const SENTENCES_T4_G01: SentenceItemData[] = [
  {
    sentence: "The sheep on the ship have an odd shape.",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetWords: ["sheep", "ship", "shape"],
    targetPhonemes: ["/iː/", "/ɪ/", "/eɪ/"],
    difficulty: 8,
    ipa: "/ðə ʃiːp ɒn ðə ʃɪp hæv ən ɒd ʃeɪp/",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Câu thử thách cao với 3 âm khác nhau",
  },
  {
    sentence: "I beat the bit with a bat after I bet.",
    soundGroupId: "map-t3-g01-front-vowel-mix",
    targetWords: ["beat", "bit", "bat", "bet"],
    targetPhonemes: ["/iː/", "/ɪ/", "/æ/", "/e/"],
    difficulty: 9,
    ipa: "/aɪ biːt ðə bɪt wɪð ə bæt ˈæftər aɪ bɛt/",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Tổng hợp 4 nguyên âm trong 1 câu",
  },
];

// ============================================================================
// TOPIC 4 - NHÓM 3: Final consonants (cap/cab)
// ============================================================================

export const WORDS_T4_G03_FINAL: WordItemData[] = [
  {
    word: "cap",
    ipa: "/kæp/",
    soundGroupId: "map-t3-g03-final-drop",
    targetPhonemes: ["/p/"],
    difficulty: 7,
    exampleSentence: "He wears a red cap.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "cab",
    ipa: "/kæb/",
    soundGroupId: "map-t3-g03-final-drop",
    targetPhonemes: ["/b/"],
    difficulty: 7,
    exampleSentence: "Call a cab for me.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "cat",
    ipa: "/kæt/",
    soundGroupId: "map-t3-g03-final-drop",
    targetPhonemes: ["/t/"],
    difficulty: 7,
    exampleSentence: "The cat is sleeping.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "cad",
    ipa: "/kæd/",
    soundGroupId: "map-t3-g03-final-drop",
    targetPhonemes: ["/d/"],
    difficulty: 7,
    exampleSentence: "He's a real cad.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "back",
    ipa: "/bæk/",
    soundGroupId: "map-t3-g03-final-drop",
    targetPhonemes: ["/k/"],
    difficulty: 7,
    exampleSentence: "Come back here!",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
  {
    word: "bag",
    ipa: "/bæg/",
    soundGroupId: "map-t3-g03-final-drop",
    targetPhonemes: ["/g/"],
    difficulty: 7,
    exampleSentence: "Put it in the bag.",
    status: "ACTIVE",
    sourceType: "FREE_API",
  },
];

export const MINIMAL_PAIRS_T4_G03: MinimalPairData[] = [
  {
    word1: "cap",
    ipa1: "/kæp/",
    word2: "cab",
    ipa2: "/kæb/",
    soundGroupId: "map-t3-g03-final-drop",
    contrastPhonemes: ["/p/", "/b/"],
    difficulty: 8,
    explanation: "Phụ âm cuối vô thanh vs hữu thanh - người Việt hay bỏ",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "cat",
    ipa1: "/kæt/",
    word2: "cad",
    ipa2: "/kæd/",
    soundGroupId: "map-t3-g03-final-drop",
    contrastPhonemes: ["/t/", "/d/"],
    difficulty: 8,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "back",
    ipa1: "/bæk/",
    word2: "bag",
    ipa2: "/bæg/",
    soundGroupId: "map-t3-g03-final-drop",
    contrastPhonemes: ["/k/", "/g/"],
    difficulty: 8,
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const SENTENCES_T4_G03: SentenceItemData[] = [
  {
    sentence: "Put the cap in the cab before you go back.",
    soundGroupId: "map-t3-g03-final-drop",
    targetWords: ["cap", "cab", "back"],
    targetPhonemes: ["/p/", "/b/", "/k/"],
    difficulty: 9,
    ipa: "/pʊt ðə kæp ɪn ðə kæb bɪˈfɔːr juː ɡoʊ bæk/",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Thử thách phụ âm cuối - không nuốt",
  },
  {
    sentence: "The cat sat in the bag with my cap.",
    soundGroupId: "map-t3-g03-final-drop",
    targetWords: ["cat", "sat", "bag", "cap"],
    targetPhonemes: ["/t/", "/t/", "/g/", "/p/"],
    difficulty: 9,
    ipa: "/ðə kæt sæt ɪn ðə bæɡ wɪð maɪ kæp/",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

// ============================================================================
// TOPIC 1 - NHÓM 3: /ɑː/ & /ʌ/ & /ə/ (father/fun/about) - NHÓM TRUNG TÂM
// ============================================================================

export const WORDS_T1_G03_CENTRAL: WordItemData[] = [
  { word: "father", ipa: "/ˈfɑːðə/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ɑː/"], difficulty: 5, exampleSentence: "My father is a teacher.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɑː/ dài, miệng mở rộng" },
  { word: "fun", ipa: "/fʌn/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ʌ/"], difficulty: 4, exampleSentence: "We had fun at the party.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʌ/ ngắn, lỏng" },
  { word: "car", ipa: "/kɑː/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ɑː/"], difficulty: 4, exampleSentence: "The car is red.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cup", ipa: "/kʌp/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ʌ/"], difficulty: 3, exampleSentence: "I need a cup of tea.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "about", ipa: "/əˈbaʊt/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ə/"], difficulty: 5, exampleSentence: "Tell me about your day.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ə/ schwa yếu, không nhấn" },
  { word: "sofa", ipa: "/ˈsəʊfə/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ə/"], difficulty: 5, exampleSentence: "The sofa is comfortable.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "heart", ipa: "/hɑːt/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ɑː/"], difficulty: 5, exampleSentence: "My heart beats fast.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "but", ipa: "/bʌt/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ʌ/"], difficulty: 3, exampleSentence: "I want to go but I'm tired.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ago", ipa: "/əˈɡəʊ/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ə/"], difficulty: 5, exampleSentence: "It happened long ago.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G03: MinimalPairData[] = [
  { word1: "father", ipa1: "/ˈfɑːðə/", word2: "fun", ipa2: "/fʌn/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 5, explanation: "/ɑː/ dài mở rộng, /ʌ/ ngắn lỏng", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp trung tâm cơ bản" },
  { word1: "car", ipa1: "/kɑː/", word2: "cup", ipa2: "/kʌp/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 4, explanation: "Chú ý độ dài và hình dạng môi", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "heart", ipa1: "/hɑːt/", word2: "hut", ipa2: "/hʌt/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 5, explanation: "/ɑː/ kéo dài, /ʌ/ ngắn", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bath", ipa1: "/bɑːθ/", word2: "but", ipa2: "/bʌt/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G03: SentenceItemData[] = [
  { sentence: "My father had fun in the car.", soundGroupId: "map-t1-g03-central", targetWords: ["father", "fun", "car"], targetPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 5, ipa: "/maɪ ˈfɑːðə hæd fʌn ɪn ðə kɑː/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 âm trung tâm" },
  { sentence: "Tell me about the cup.", soundGroupId: "map-t1-g03-central", targetWords: ["about", "cup"], targetPhonemes: ["/ə/", "/ʌ/"], difficulty: 5, ipa: "/tɛl miː əˈbaʊt ðə kʌp/", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "My heart was cold but I had fun.", soundGroupId: "map-t1-g03-central", targetWords: ["heart", "but", "fun"], targetPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 6, ipa: "/maɪ hɑːt wəz koʊld bʌt aɪ hæd fʌn/", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 5: /ʊ/ & /uː/ (full/fool) - SAU NGẮN & SAU DÀI
// ============================================================================

export const WORDS_T1_G05_U_UH: WordItemData[] = [
  { word: "full", ipa: "/fʊl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "The glass is full.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʊ/ ngắn lỏng" },
  { word: "fool", ipa: "/fuːl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "Don't be a fool.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/uː/ dài căng" },
  { word: "pull", ipa: "/pʊl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "Pull the door open.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "pool", ipa: "/puːl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "The pool is clean.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "look", ipa: "/lʊk/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "Look at the sky.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "food", ipa: "/fuːd/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "The food is delicious.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "book", ipa: "/buːk/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "I read a book.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "blue", ipa: "/bluː/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 4, exampleSentence: "The sky is blue.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G05: MinimalPairData[] = [
  { word1: "full", ipa1: "/fʊl/", word2: "fool", ipa2: "/fuːl/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 3, explanation: "/ʊ/ ngắn lỏng, /uː/ dài căng môi", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp sau cổ điển" },
  { word1: "pull", ipa1: "/pʊl/", word2: "pool", ipa2: "/puːl/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 3, explanation: "Chú ý độ dài", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "look", ipa1: "/lʊk/", word2: "Luke", ipa2: "/luːk/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "good", ipa1: "/ɡʊd/", word2: "food", ipa2: "/fuːd/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G05: SentenceItemData[] = [
  { sentence: "The fool pulled the full bucket.", soundGroupId: "map-t1-g05-u-uh", targetWords: ["fool", "pulled", "full"], targetPhonemes: ["/uː/", "/ʊ/", "/ʊ/"], difficulty: 5, ipa: "/ðə fuːl pʊld ðə fʊl ˈbʌkɪt/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 âm sau" },
  { sentence: "Look at the blue pool.", soundGroupId: "map-t1-g05-u-uh", targetWords: ["Look", "blue", "pool"], targetPhonemes: ["/ʊ/", "/uː/", "/uː/"], difficulty: 4, ipa: "/lʊk æt ðə bluː puːl/", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Good food in the book.", soundGroupId: "map-t1-g05-u-uh", targetWords: ["Good", "food", "book"], targetPhonemes: ["/ʊ/", "/uː/", "/ʊ/"], difficulty: 4, ipa: "/ɡʊd fuːd ɪn ðə buːk/", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 6: /ɜː/ (bird/word) - ÂM GIỮA ĐẶC BIỆT (KHÔNG CẶP)
// ============================================================================

export const WORDS_T1_G06_ER: WordItemData[] = [
  { word: "bird", ipa: "/bɜːd/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 6, exampleSentence: "The bird is singing.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɜː/ không có trong tiếng Việt" },
  { word: "word", ipa: "/wɜːd/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "Say each word clearly.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "nurse", ipa: "/nɜːs/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 6, exampleSentence: "The nurse is kind.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "girl", ipa: "/ɡɜːl/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "The girl is happy.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "work", ipa: "/wɜːk/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "I go to work early.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "learn", ipa: "/lɜːn/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 6, exampleSentence: "We learn English.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "turn", ipa: "/tɜːn/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "Turn left at the corner.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "her", ipa: "/hɜː/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 4, exampleSentence: "Give her the book.", status: "ACTIVE", sourceType: "FREE_API" },
];

// g06 /ɜː/ không có cặp → MINIMAL_PAIRS_T1_G06 rỗng
export const MINIMAL_PAIRS_T1_G06: MinimalPairData[] = [];

export const SENTENCES_T1_G06: SentenceItemData[] = [
  { sentence: "The nurse learns to work with the bird.", soundGroupId: "map-t1-g06-er", targetWords: ["nurse", "learns", "work", "bird"], targetPhonemes: ["/ɜː/"], difficulty: 6, ipa: "/ðə nɜːs lɜːnz tuː wɜːk wɪð ðə bɜːd/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Nhiều từ /ɜː/ trong 1 câu" },
  { sentence: "The girl turned to her word.", soundGroupId: "map-t1-g06-er", targetWords: ["girl", "turned", "her", "word"], targetPhonemes: ["/ɜː/"], difficulty: 6, ipa: "/ðə ɡɜːl tɜːnd tuː hɜː wɜːd/", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Learn to work hard.", soundGroupId: "map-t1-g06-er", targetWords: ["Learn", "work"], targetPhonemes: ["/ɜː/"], difficulty: 5, ipa: "/lɜːn tuː wɜːk hɑːd/", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 7: /eɪ/ & /aɪ/ (day/die) - KẾT THÚC BẰNG /ɪ/
// ============================================================================

export const WORDS_T1_G07_EI_AI: WordItemData[] = [
  { word: "day", ipa: "/deɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 3, exampleSentence: "Have a nice day.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/eɪ/ trượt từ /e/ lên /ɪ/" },
  { word: "die", ipa: "/daɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 3, exampleSentence: "The plant will die.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/aɪ/ trượt từ /a/ lên /ɪ/" },
  { word: "make", ipa: "/meɪk/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 3, exampleSentence: "Make a cake.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "my", ipa: "/maɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 2, exampleSentence: "My book is here.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "they", ipa: "/ðeɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 4, exampleSentence: "They are friends.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "thigh", ipa: "/θaɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 5, exampleSentence: "My thigh hurts.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "name", ipa: "/neɪm/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 3, exampleSentence: "What is your name?", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "time", ipa: "/taɪm/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 3, exampleSentence: "What time is it?", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G07: MinimalPairData[] = [
  { word1: "day", ipa1: "/deɪ/", word2: "die", ipa2: "/daɪ/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 3, explanation: "/eɪ/ từ /e/, /aɪ/ từ /a/ — cùng kết /ɪ/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp diphthong cơ bản" },
  { word1: "make", ipa1: "/meɪk/", word2: "Mike", ipa2: "/maɪk/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "they", ipa1: "/ðeɪ/", word2: "thigh", ipa2: "/θaɪ/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "name", ipa1: "/neɪm/", word2: "time", ipa2: "/taɪm/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G07: SentenceItemData[] = [
  { sentence: "Make my day with your name.", soundGroupId: "map-t1-g07-ei-ai", targetWords: ["Make", "my", "day", "name"], targetPhonemes: ["/eɪ/", "/aɪ/", "/eɪ/", "/eɪ/"], difficulty: 5, ipa: "/meɪk maɪ deɪ wɪð jɔːr neɪm/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 diphthong" },
  { sentence: "They had a good time.", soundGroupId: "map-t1-g07-ei-ai", targetWords: ["They", "time"], targetPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, ipa: "/ðeɪ hæd ə ɡʊd taɪm/", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "My thigh hurts today.", soundGroupId: "map-t1-g07-ei-ai", targetWords: ["My", "thigh"], targetPhonemes: ["/aɪ/", "/aɪ/"], difficulty: 5, ipa: "/maɪ θaɪ hɜːts təˈdeɪ/", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 8: /ɔɪ/ & /aʊ/ (boy/now) - /ɔɪ/ LÊN, /aʊ/ XUỐNG-LÊN
// ============================================================================

export const WORDS_T1_G08_OI_AU: WordItemData[] = [
  { word: "boy", ipa: "/bɔɪ/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 4, exampleSentence: "The boy is tall.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɔɪ/ trượt từ /ɔ/ lên /ɪ/" },
  { word: "now", ipa: "/naʊ/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "Do it now.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/aʊ/ trượt từ /a/ tới /ʊ/" },
  { word: "coin", ipa: "/kɔɪn/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 4, exampleSentence: "I have a coin.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "house", ipa: "/haʊs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "My house is big.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "voice", ipa: "/vɔɪs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 5, exampleSentence: "Your voice is nice.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "mouse", ipa: "/maʊs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "The mouse is small.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "choice", ipa: "/tʃɔɪs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 5, exampleSentence: "Make your choice.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "out", ipa: "/aʊt/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "Go out and play.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G08: MinimalPairData[] = [
  { word1: "boy", ipa1: "/bɔɪ/", word2: "bow", ipa2: "/baʊ/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 5, explanation: "/ɔɪ/ kết /ɪ/, /aʊ/ kết /ʊ/ — hướng khác nhau", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp diphthong khác hướng" },
  { word1: "coin", ipa1: "/kɔɪn/", word2: "count", ipa2: "/kaʊnt/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "voice", ipa1: "/vɔɪs/", word2: "vow", ipa2: "/vaʊ/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "choice", ipa1: "/tʃɔɪs/", word2: "chouse", ipa2: "/tʃaʊs/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "chouse là từ hiếm, dùng minh họa cặp" },
];

export const SENTENCES_T1_G08: SentenceItemData[] = [
  { sentence: "The boy found a coin in the house.", soundGroupId: "map-t1-g08-oi-au", targetWords: ["boy", "coin", "house"], targetPhonemes: ["/ɔɪ/", "/ɔɪ/", "/aʊ/"], difficulty: 5, ipa: "/ðə bɔɪ faʊnd ə kɔɪn ɪn ðə haʊs/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 diphthong" },
  { sentence: "The mouse ran out of the house.", soundGroupId: "map-t1-g08-oi-au", targetWords: ["mouse", "out", "house"], targetPhonemes: ["/aʊ/", "/aʊ/", "/aʊ/"], difficulty: 4, ipa: "/ðə maʊs ræn aʊt ɒv ðə haʊs/", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Make your choice with your voice.", soundGroupId: "map-t1-g08-oi-au", targetWords: ["choice", "voice"], targetPhonemes: ["/ɔɪ/", "/ɔɪ/"], difficulty: 5, ipa: "/meɪk jɔːr tʃɔɪs wɪð jɔːr vɔɪs/", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 9: /əʊ/ & /eə/ (go/air) - NHÓM TRUNG TÂM
// ============================================================================

export const WORDS_T1_G09_OU_EA: WordItemData[] = [
  { word: "go", ipa: "/ɡəʊ/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 3, exampleSentence: "Let's go home.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/əʊ/ trượt từ schwa tới /ʊ/" },
  { word: "air", ipa: "/eə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "The air is fresh.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/eə/ trượt từ /e/ tới schwa" },
  { word: "home", ipa: "/həʊm/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 3, exampleSentence: "I go home.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "care", ipa: "/keə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "Take care of yourself.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "know", ipa: "/nəʊ/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 3, exampleSentence: "I know the answer.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "there", ipa: "/ðeə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "He is there.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "show", ipa: "/ʃəʊ/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 4, exampleSentence: "Show me the way.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "where", ipa: "/weə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "Where are you?", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G09: MinimalPairData[] = [
  { word1: "go", ipa1: "/ɡəʊ/", word2: "gear", ipa2: "/ɡɪə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/ɪə/"], difficulty: 6, explanation: "Cặp diphthong trung tâm", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Phân biệt 2 diphthong kết schwa" },
  { word1: "home", ipa1: "/həʊm/", word2: "hair", ipa2: "/heə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/eə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "know", ipa1: "/nəʊ/", word2: "near", ipa2: "/nɪə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/ɪə/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "show", ipa1: "/ʃəʊ/", word2: "share", ipa2: "/ʃeə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/eə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G09: SentenceItemData[] = [
  { sentence: "Go home and take care.", soundGroupId: "map-t1-g09-ou-ea", targetWords: ["Go", "home", "care"], targetPhonemes: ["/əʊ/", "/əʊ/", "/eə/"], difficulty: 5, ipa: "/ɡəʊ həʊm ænd teɪk keə/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 diphthong" },
  { sentence: "I know where he is there.", soundGroupId: "map-t1-g09-ou-ea", targetWords: ["know", "where", "there"], targetPhonemes: ["/əʊ/", "/eə/", "/eə/"], difficulty: 5, ipa: "/aɪ nəʊ weər hiː ɪz ðeə/", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Show me the way home.", soundGroupId: "map-t1-g09-ou-ea", targetWords: ["Show", "home"], targetPhonemes: ["/əʊ/", "/əʊ/"], difficulty: 4, ipa: "/ʃəʊ miː ðə weɪ həʊm/", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 10: /ɪə/ & /ʊə/ (ear/tour) - KẾT THÚC BẰNG SCHWA
// ============================================================================

export const WORDS_T1_G10_IA_UA: WordItemData[] = [
  { word: "ear", ipa: "/ɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "I have an ear ache.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɪə/ trượt từ /ɪ/ tới schwa" },
  { word: "tour", ipa: "/tʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 6, exampleSentence: "The tour was great.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʊə/ trượt từ /ʊ/ tới schwa" },
  { word: "here", ipa: "/hɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "Come here.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "poor", ipa: "/pʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 5, exampleSentence: "The poor man needs help.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "fear", ipa: "/fɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "Don't fear the dark.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "sure", ipa: "/ʃʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 5, exampleSentence: "I am sure.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "near", ipa: "/nɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "The shop is near.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "pure", ipa: "/pjʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 6, exampleSentence: "The water is pure.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G10: MinimalPairData[] = [
  { word1: "ear", ipa1: "/ɪə/", word2: "tour", ipa2: "/tʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 5, explanation: "/ɪə/ từ /ɪ/, /ʊə/ từ /ʊ/ — cùng kết schwa", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp diphthong kết schwa" },
  { word1: "here", ipa1: "/hɪə/", word2: "poor", ipa2: "/pʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "fear", ipa1: "/fɪə/", word2: "sure", ipa2: "/ʃʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "near", ipa1: "/nɪə/", word2: "pure", ipa2: "/pjʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G10: SentenceItemData[] = [
  { sentence: "Come here near my ear.", soundGroupId: "map-t1-g10-ia-ua", targetWords: ["here", "near", "ear"], targetPhonemes: ["/ɪə/", "/ɪə/", "/ɪə/"], difficulty: 5, ipa: "/kʌm hɪər nɪər maɪ ɪə/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu nhiều /ɪə/" },
  { sentence: "The poor man is sure of the tour.", soundGroupId: "map-t1-g10-ia-ua", targetWords: ["poor", "sure", "tour"], targetPhonemes: ["/ʊə/", "/ʊə/", "/ʊə/"], difficulty: 6, ipa: "/ðə pʊər mæn ɪz ʃʊər ɒv ðə tʊər/", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't fear the pure air.", soundGroupId: "map-t1-g10-ia-ua", targetWords: ["fear", "pure"], targetPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 6, ipa: "/doʊnt fɪər ðə pjʊər eər/", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 1: /p/ & /b/ (Plosives)
// ============================================================================

export const WORDS_T2_G01_P_B: WordItemData[] = [
  { word: "pat", ipa: "/pæt/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 2, exampleSentence: "Pat the dog gently.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Từ cơ bản" },
  { word: "bat", ipa: "/bæt/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 2, exampleSentence: "The bat flew at night.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Contrast /p/ vs /b/" },
  { word: "cap", ipa: "/kæp/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 2, exampleSentence: "Wear a cap in the sun.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cab", ipa: "/kæb/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 2, exampleSentence: "Call a cab now.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rope", ipa: "/roʊp/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 3, exampleSentence: "Tie the rope tight.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/p/ cuối từ" },
  { word: "robe", ipa: "/roʊb/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 3, exampleSentence: "She wore a silk robe.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/b/ cuối từ" },
  { word: "pen", ipa: "/pen/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 1, exampleSentence: "Write with a pen.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bed", ipa: "/bed/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 1, exampleSentence: "Go to bed early.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "pin", ipa: "/pɪn/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 1, exampleSentence: "Pin the paper down.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bin", ipa: "/bɪn/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 1, exampleSentence: "Throw it in the bin.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G01: MinimalPairData[] = [
  { word1: "pat", ipa1: "/pæt/", word2: "bat", ipa2: "/bæt/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 2, explanation: "/p/ voiceless thổi hơi, /b/ voiced rung dây thanh", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /p/ vs /b/ initial" },
  { word1: "cap", ipa1: "/kæp/", word2: "cab", ipa2: "/kæb/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 3, explanation: "/p/ vs /b/ cuối từ — /b/ cuối có rung dây", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Contrast cuối từ" },
  { word1: "rope", ipa1: "/roʊp/", word2: "robe", ipa2: "/roʊb/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 4, explanation: "/p/ vs /b/ cuối từ sau nguyên âm dài", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "pin", ipa1: "/pɪn/", word2: "bin", ipa2: "/bɪn/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 2, explanation: "/p/ vs /b/ initial trước /ɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "pea", ipa1: "/piː/", word2: "bee", ipa2: "/biː/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 2, explanation: "/p/ vs /b/ trước nguyên âm dài /iː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cup", ipa1: "/kʌp/", word2: "cub", ipa2: "/kʌb/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 3, explanation: "/p/ vs /b/ cuối từ trước /ʌ/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G01: SentenceItemData[] = [
  { sentence: "Pat the big bat.", soundGroupId: "map-t2-g01-p-b", targetWords: ["pat", "bat"], targetPhonemes: ["/p/", "/b/"], difficulty: 3, ipa: "/pæt ðə bɪɡ bæt/", translation: "Vuốt con dơi lớn.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Put the pen in the bin.", soundGroupId: "map-t2-g01-p-b", targetWords: ["pen", "bin"], targetPhonemes: ["/p/", "/b/"], difficulty: 3, ipa: "/pʊt ðə pɛn ɪn ðə bɪn/", translation: "Bỏ bút vào thùng rác.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The cab has a cap.", soundGroupId: "map-t2-g01-p-b", targetWords: ["cab", "cap"], targetPhonemes: ["/b/", "/p/"], difficulty: 4, ipa: "/ðə kæb hæz ə kæp/", translation: "Xe taxi có mũ.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Pin the rope to the robe.", soundGroupId: "map-t2-g01-p-b", targetWords: ["pin", "rope", "robe"], targetPhonemes: ["/p/", "/b/"], difficulty: 5, ipa: "/pɪn ðə roʊp tuː ðə roʊb/", translation: "Ghim dây thừng vào áo choàng.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 2: /t/ & /d/ (Plosives)
// ============================================================================

export const WORDS_T2_G02_T_D: WordItemData[] = [
  { word: "ten", ipa: "/ten/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 1, exampleSentence: "Count to ten.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "den", ipa: "/den/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 2, exampleSentence: "The fox lives in a den.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "to", ipa: "/tuː/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 1, exampleSentence: "Go to school.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "do", ipa: "/duː/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 1, exampleSentence: "Do your homework.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "mat", ipa: "/mæt/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 2, exampleSentence: "Wipe your feet on the mat.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/t/ cuối từ" },
  { word: "mad", ipa: "/mæd/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 2, exampleSentence: "Don't get mad.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/d/ cuối từ" },
  { word: "bet", ipa: "/bet/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 2, exampleSentence: "I bet you can.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bed", ipa: "/bed/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 2, exampleSentence: "Go to bed.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cart", ipa: "/kɑːrt/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 3, exampleSentence: "Push the shopping cart.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/t/ cuối sau /ɑːr/" },
  { word: "card", ipa: "/kɑːrd/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 3, exampleSentence: "Pay with a card.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/d/ cuối sau /ɑːr/" },
];

export const MINIMAL_PAIRS_T2_G02: MinimalPairData[] = [
  { word1: "ten", ipa1: "/ten/", word2: "den", ipa2: "/den/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 2, explanation: "/t/ voiceless, /d/ voiced initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /t/ vs /d/" },
  { word1: "mat", ipa1: "/mæt/", word2: "mad", ipa2: "/mæd/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 3, explanation: "/t/ vs /d/ cuối từ — /d/ cuối rung dây", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bet", ipa1: "/bet/", word2: "bed", ipa2: "/bed/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 2, explanation: "/t/ vs /d/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cart", ipa1: "/kɑːrt/", word2: "card", ipa2: "/kɑːrd/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 4, explanation: "/t/ vs /d/ cuối sau /ɑːr/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "to", ipa1: "/tuː/", word2: "do", ipa2: "/duː/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 1, explanation: "/t/ vs /d/ trước /uː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "told", ipa1: "/toʊld/", word2: "sold", ipa2: "/soʊld/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/"], difficulty: 4, explanation: "/t/ initial vs /s/ — phụ âm đầu khác", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp phụ âm đầu (luyện /t/)" },
];

export const SENTENCES_T2_G02: SentenceItemData[] = [
  { sentence: "Ten dens in the forest.", soundGroupId: "map-t2-g02-t-d", targetWords: ["ten", "dens"], targetPhonemes: ["/t/", "/d/"], difficulty: 4, ipa: "/tɛn dɛnz ɪn ðə ˈfɒrɪst/", translation: "Mười cái hang trong rừng.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't get mad on the mat.", soundGroupId: "map-t2-g02-t-d", targetWords: ["mad", "mat"], targetPhonemes: ["/d/", "/t/"], difficulty: 4, ipa: "/doʊnt ɡɛt mæd ɒn ðə mæt/", translation: "Đừng tức giận trên thảm.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Bet on the bed.", soundGroupId: "map-t2-g02-t-d", targetWords: ["bet", "bed"], targetPhonemes: ["/t/", "/d/"], difficulty: 3, ipa: "/bɛt ɒn ðə bɛd/", translation: "Cược trên giường.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Pay the card on the cart.", soundGroupId: "map-t2-g02-t-d", targetWords: ["card", "cart"], targetPhonemes: ["/d/", "/t/"], difficulty: 5, ipa: "/peɪ ðə kɑːrd ɒn ðə kɑːrt/", translation: "Trả thẻ trên xe đẩy.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 3: /k/ & /g/ (Plosives)
// ============================================================================

export const WORDS_T2_G03_K_G: WordItemData[] = [
  { word: "cap", ipa: "/kæp/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 2, exampleSentence: "Put on your cap.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "gap", ipa: "/gæp/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 2, exampleSentence: "Mind the gap.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "coat", ipa: "/koʊt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 2, exampleSentence: "Wear a warm coat.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "goat", ipa: "/goʊt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 2, exampleSentence: "The goat eats grass.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "back", ipa: "/bæk/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 2, exampleSentence: "Come back soon.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/k/ cuối từ" },
  { word: "bag", ipa: "/bæɡ/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 2, exampleSentence: "Open the bag.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/g/ cuối từ" },
  { word: "lock", ipa: "/lɑːk/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 3, exampleSentence: "Lock the door.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "log", ipa: "/lɑːɡ/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 3, exampleSentence: "Sit on a log.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "kite", ipa: "/kaɪt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 3, exampleSentence: "Fly a kite.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "gate", ipa: "/ɡeɪt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 3, exampleSentence: "Open the gate.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G03: MinimalPairData[] = [
  { word1: "cap", ipa1: "/kæp/", word2: "gap", ipa2: "/gæp/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 2, explanation: "/k/ voiceless, /g/ voiced initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /k/ vs /g/" },
  { word1: "coat", ipa1: "/koʊt/", word2: "goat", ipa2: "/goʊt/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 2, explanation: "/k/ vs /g/ initial", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "back", ipa1: "/bæk/", word2: "bag", ipa2: "/bæɡ/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 3, explanation: "/k/ vs /g/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "lock", ipa1: "/lɑːk/", word2: "log", ipa2: "/lɑːɡ/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 3, explanation: "/k/ vs /g/ cuối sau /ɑː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "curl", ipa1: "/kɜːrl/", word2: "girl", ipa2: "/ɡɜːrl/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 4, explanation: "/k/ vs /g/ initial trước /ɜːr/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cold", ipa1: "/koʊld/", word2: "gold", ipa2: "/ɡoʊld/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 3, explanation: "/k/ vs /g/ initial trước /oʊl/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G03: SentenceItemData[] = [
  { sentence: "Mind the gap in the cap.", soundGroupId: "map-t2-g03-k-g", targetWords: ["gap", "cap"], targetPhonemes: ["/g/", "/k/"], difficulty: 4, translation: "Chú ý khe hở trong mũ.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The goat lost its coat.", soundGroupId: "map-t2-g03-k-g", targetWords: ["goat", "coat"], targetPhonemes: ["/g/", "/k/"], difficulty: 4, translation: "Con dê mất áo khoác.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Put the bag on the back.", soundGroupId: "map-t2-g03-k-g", targetWords: ["bag", "back"], targetPhonemes: ["/g/", "/k/"], difficulty: 4, translation: "Đặt túi lên lưng.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Lock the log at the gate.", soundGroupId: "map-t2-g03-k-g", targetWords: ["lock", "log", "gate"], targetPhonemes: ["/k/", "/g/"], difficulty: 5, translation: "Khóa khúc gỗ ở cổng.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// ============================================================================
// TOPIC 2 - NHÓM 4: /f/ & /v/ (Fricatives)
// ============================================================================

export const WORDS_T2_G04_F_V: WordItemData[] = [
  { word: "fan", ipa: "/fæn/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 2, exampleSentence: "Use a fan in summer.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "van", ipa: "/væn/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 2, exampleSentence: "The van is blue.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "safe", ipa: "/seɪf/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 3, exampleSentence: "Stay safe at home.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/f/ cuối từ" },
  { word: "save", ipa: "/seɪv/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 3, exampleSentence: "Save your money.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/v/ cuối từ" },
  { word: "leaf", ipa: "/liːf/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 3, exampleSentence: "A green leaf fell.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "leave", ipa: "/liːv/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 3, exampleSentence: "Leave now please.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "fast", ipa: "/fæst/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 2, exampleSentence: "Drive fast.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "vest", ipa: "/vest/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 2, exampleSentence: "Wear a life vest.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "half", ipa: "/hæf/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 3, exampleSentence: "Cut it in half.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "have", ipa: "/hæv/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 1, exampleSentence: "I have a book.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G04: MinimalPairData[] = [
  { word1: "fan", ipa1: "/fæn/", word2: "van", ipa2: "/væn/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 2, explanation: "/f/ voiceless, /v/ voiced — người Việt hay đọc /v/ thành /f/ hoặc /w/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /f/ vs /v/" },
  { word1: "safe", ipa1: "/seɪf/", word2: "save", ipa2: "/seɪv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 3, explanation: "/f/ vs /v/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "leaf", ipa1: "/liːf/", word2: "leave", ipa2: "/liːv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 3, explanation: "/f/ vs /v/ cuối sau /iː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "fast", ipa1: "/fæst/", word2: "vest", ipa2: "/vest/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 3, explanation: "/f/ vs /v/ initial + phụ âm 2 khác", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "proof", ipa1: "/pruːf/", word2: "prove", ipa2: "/pruːv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 4, explanation: "/f/ vs /v/ cuối sau /uː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "half", ipa1: "/hæf/", word2: "have", ipa2: "/hæv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 3, explanation: "/f/ vs /v/ cuối từ — từ cực common", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G04: SentenceItemData[] = [
  { sentence: "The van has a fan.", soundGroupId: "map-t2-g04-f-v", targetWords: ["van", "fan"], targetPhonemes: ["/v/", "/f/"], difficulty: 4, translation: "Xe tải có quạt.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Save the safe.", soundGroupId: "map-t2-g04-f-v", targetWords: ["save", "safe"], targetPhonemes: ["/v/", "/f/"], difficulty: 4, translation: "Cứu cái két.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't leave the leaf.", soundGroupId: "map-t2-g04-f-v", targetWords: ["leave", "leaf"], targetPhonemes: ["/v/", "/f/"], difficulty: 4, translation: "Đừng bỏ lại chiếc lá.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Wear a vest and run fast.", soundGroupId: "map-t2-g04-f-v", targetWords: ["vest", "fast"], targetPhonemes: ["/v/", "/f/"], difficulty: 5, translation: "Mặc áo phao và chạy nhanh.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 5: /θ/ & /ð/ (Fricatives) — "th" think/this
// ============================================================================

export const WORDS_T2_G05_TH_DH: WordItemData[] = [
  { word: "think", ipa: "/θɪŋk/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "I think you're right.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/θ/ voiceless — người Việt hay đọc /t/ hoặc /s/" },
  { word: "this", ipa: "/ðɪs/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 3, exampleSentence: "This is good.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ð/ voiced" },
  { word: "thumb", ipa: "/θʌm/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "Thumb up please.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "them", ipa: "/ðem/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 2, exampleSentence: "Give it to them.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bath", ipa: "/bæθ/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 3, exampleSentence: "Take a bath.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/θ/ cuối từ" },
  { word: "bathe", ipa: "/beɪð/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 4, exampleSentence: "Bathe the baby.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ð/ cuối từ" },
  { word: "thick", ipa: "/θɪk/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "The book is thick.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "then", ipa: "/ðen/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 2, exampleSentence: "Then we go home.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "mouth", ipa: "/maʊθ/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "Open your mouth.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/θ/ cuối từ" },
  { word: "mother", ipa: "/ˈmʌðər/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 3, exampleSentence: "Mother is kind.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G05: MinimalPairData[] = [
  { word1: "think", ipa1: "/θɪŋk/", word2: "this", ipa2: "/ðɪs/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/ð/"], difficulty: 4, explanation: "/θ/ voiceless (think) vs /ð/ voiced (this) — cùng chữ 'th'", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /θ/ vs /ð/" },
  { word1: "thick", ipa1: "/θɪk/", word2: "tick", ipa2: "/tɪk/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/t/"], difficulty: 4, explanation: "/θ/ vs /t/ — người Việt hay đọc /θ/ thành /t/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bath", ipa1: "/bæθ/", word2: "bathe", ipa2: "/beɪð/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/ð/"], difficulty: 4, explanation: "/θ/ vs /ð/ cuối từ (cặp danh-động)", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "thumb", ipa1: "/θʌm/", word2: "sum", ipa2: "/sʌm/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/s/"], difficulty: 4, explanation: "/θ/ vs /s/ — người Việt hay đọc /θ/ thành /s/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "them", ipa1: "/ðem/", word2: "den", ipa2: "/den/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/ð/", "/d/"], difficulty: 3, explanation: "/ð/ vs /d/ — /ð/ voiced nhẹ hơn /d/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "mouth", ipa1: "/maʊθ/", word2: "mouse", ipa2: "/maʊs/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/s/"], difficulty: 4, explanation: "/θ/ vs /s/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G05: SentenceItemData[] = [
  { sentence: "I think this is good.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["think", "this"], targetPhonemes: ["/θ/", "/ð/"], difficulty: 4, translation: "Tôi nghĩ cái này tốt.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Bathe in the bath.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["bathe", "bath"], targetPhonemes: ["/ð/", "/θ/"], difficulty: 5, translation: "Tắm trong bồn tắm.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The thumb is thick.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["thumb", "thick"], targetPhonemes: ["/θ/"], difficulty: 4, translation: "Ngón cái dày.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Mother opens her mouth.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["mother", "mouth"], targetPhonemes: ["/ð/", "/θ/"], difficulty: 5, translation: "Mẹ mở miệng.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 6: /s/ & /z/ (Fricatives)
// ============================================================================

export const WORDS_T2_G06_S_Z: WordItemData[] = [
  { word: "sip", ipa: "/sɪp/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 2, exampleSentence: "Sip the tea slowly.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "zip", ipa: "/zɪp/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 2, exampleSentence: "Zip the bag up.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rice", ipa: "/raɪs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 3, exampleSentence: "Eat rice daily.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/s/ cuối từ" },
  { word: "rise", ipa: "/raɪz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 3, exampleSentence: "Rise and shine.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/z/ cuối từ" },
  { word: "ice", ipa: "/aɪs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 2, exampleSentence: "Ice is cold.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "eyes", ipa: "/aɪz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 2, exampleSentence: "Close your eyes.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bus", ipa: "/bʌs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 2, exampleSentence: "Take the bus.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "buzz", ipa: "/bʌz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 3, exampleSentence: "Bees buzz around.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "loose", ipa: "/luːs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 3, exampleSentence: "The rope is loose.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "lose", ipa: "/luːz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 3, exampleSentence: "Don't lose the key.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G06: MinimalPairData[] = [
  { word1: "sip", ipa1: "/sɪp/", word2: "zip", ipa2: "/zɪp/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 2, explanation: "/s/ voiceless, /z/ voiced initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /s/ vs /z/" },
  { word1: "rice", ipa1: "/raɪs/", word2: "rise", ipa2: "/raɪz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 3, explanation: "/s/ vs /z/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "ice", ipa1: "/aɪs/", word2: "eyes", ipa2: "/aɪz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 2, explanation: "/s/ vs /z/ cuối từ — người Việt hay đọc eyes thành 'ais'", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bus", ipa1: "/bʌs/", word2: "buzz", ipa2: "/bʌz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 3, explanation: "/s/ vs /z/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "loose", ipa1: "/luːs/", word2: "lose", ipa2: "/luːz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 3, explanation: "/s/ vs /z/ cuối sau /uː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "price", ipa1: "/praɪs/", word2: "prize", ipa2: "/praɪz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 4, explanation: "/s/ vs /z/ cuối sau /aɪ/ + cluster /pr/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G06: SentenceItemData[] = [
  { sentence: "Sip the zip.", soundGroupId: "map-t2-g06-s-z", targetWords: ["sip", "zip"], targetPhonemes: ["/s/", "/z/"], difficulty: 4, translation: "Nhấp cái khóa.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rice rises in price.", soundGroupId: "map-t2-g06-s-z", targetWords: ["rice", "rises", "price"], targetPhonemes: ["/s/", "/z/"], difficulty: 5, translation: "Gạo tăng giá.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Ice in the eyes.", soundGroupId: "map-t2-g06-s-z", targetWords: ["ice", "eyes"], targetPhonemes: ["/s/", "/z/"], difficulty: 4, translation: "Đá trong mắt.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't lose the loose bus.", soundGroupId: "map-t2-g06-s-z", targetWords: ["lose", "loose", "bus"], targetPhonemes: ["/z/", "/s/"], difficulty: 5, translation: "Đừng mất chiếc xe lỏng lẻo.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 7: /ʃ/ & /ʒ/ (Fricatives) — shoe/vision
// ============================================================================

export const WORDS_T2_G07_SH_ZH: WordItemData[] = [
  { word: "she", ipa: "/ʃiː/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 1, exampleSentence: "She is here.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "shoe", ipa: "/ʃuː/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Tie your shoe.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "wash", ipa: "/wɒʃ/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Wash your hands.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʃ/ cuối từ" },
  { word: "vision", ipa: "/ˈvɪʒən/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Good vision is important.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʒ/ hiếm — chỉ trong measure/vision/pleasure" },
  { word: "measure", ipa: "/ˈmeʒər/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Measure the table.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "leisure", ipa: "/ˈleʒər/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Leisure time is fun.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ship", ipa: "/ʃɪp/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "The ship sailed.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "wish", ipa: "/wɪʃ/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Make a wish.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "dish", ipa: "/dɪʃ/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Wash the dish.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "treasure", ipa: "/ˈtreʒər/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Find the treasure.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G07: MinimalPairData[] = [
  { word1: "shoe", ipa1: "/ʃuː/", word2: "sue", ipa2: "/suː/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/s/"], difficulty: 3, explanation: "/ʃ/ vs /s/ — /ʃ/ môi tròn, /s/ răng", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /ʃ/ vs /s/ (luyện /ʃ/ rõ)" },
  { word1: "ship", ipa1: "/ʃɪp/", word2: "sip", ipa2: "/sɪp/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/s/"], difficulty: 3, explanation: "/ʃ/ vs /s/ initial trước /ɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "wash", ipa1: "/wɒʃ/", word2: "watch", ipa2: "/wɒtʃ/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/tʃ/"], difficulty: 4, explanation: "/ʃ/ (fricative) vs /tʃ/ (affricate — có stop)", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "wish", ipa1: "/wɪʃ/", word2: "which", ipa2: "/wɪtʃ/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/tʃ/"], difficulty: 4, explanation: "/ʃ/ vs /tʃ/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "measure", ipa1: "/ˈmeʒər/", word2: "mesher", ipa2: "/ˈmeʃər/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʒ/", "/ʃ/"], difficulty: 6, explanation: "/ʒ/ voiced vs /ʃ/ voiceless — cùng vị trí articulation", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /ʒ/ vs /ʃ/ (voiceless vs voiced cùng vị trí)" },
  { word1: "vision", ipa1: "/ˈvɪʒən/", word2: "fission", ipa2: "/ˈfɪʃən/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʒ/", "/ʃ/"], difficulty: 6, explanation: "/ʒ/ vs /ʃ/ giữa từ", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G07: SentenceItemData[] = [
  { sentence: "She washes the shoe.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["she", "washes", "shoe"], targetPhonemes: ["/ʃ/"], difficulty: 4, translation: "Cô ấy giặt chiếc giày.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Measure the treasure for leisure.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["measure", "treasure", "leisure"], targetPhonemes: ["/ʒ/"], difficulty: 6, translation: "Đo kho báu cho giải trí.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Wish for a dish.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["wish", "dish"], targetPhonemes: ["/ʃ/"], difficulty: 3, translation: "Ước có đĩa thức ăn.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Vision of the ship.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["vision", "ship"], targetPhonemes: ["/ʒ/", "/ʃ/"], difficulty: 5, translation: "Tầm nhìn của con tàu.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 8: /h/ (Fricatives, single phoneme — 0 cặp)
// ============================================================================

export const WORDS_T2_G08_H: WordItemData[] = [
  { word: "hat", ipa: "/hæt/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Wear a hat.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/h/ initial — thở hơi mạnh" },
  { word: "hot", ipa: "/hɑːt/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "The soup is hot.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "house", ipa: "/haʊs/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Build a house.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "hand", ipa: "/hænd/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Raise your hand.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "happy", ipa: "/ˈhæpi/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "I feel happy.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "head", ipa: "/hed/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Nod your head.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "horse", ipa: "/hɔːrs/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 3, exampleSentence: "Ride a horse.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "heart", ipa: "/hɑːrt/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 3, exampleSentence: "A kind heart.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "behind", ipa: "/bɪˈhaɪnd/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 4, exampleSentence: "Stand behind me.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/h/ giữa từ (stress syllable)" },
  { word: "hello", ipa: "/həˈloʊ/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 1, exampleSentence: "Say hello.", status: "ACTIVE", sourceType: "FREE_API" },
];

// g08 /h/ đơn phoneme không có contrast tự nhiên → 0 cặp. speak_minimal_pair DRAFT.
// listen_choose 3-stage tự mồi neighbor phoneme (g07 /ʃ//ʒ/ hoặc g09 /tʃ//dʒ/) qua orderIndex±1.
export const MINIMAL_PAIRS_T2_G08: MinimalPairData[] = [];

export const SENTENCES_T2_G08: SentenceItemData[] = [
  { sentence: "The hot hat is here.", soundGroupId: "map-t2-g08-h", targetWords: ["hot", "hat"], targetPhonemes: ["/h/"], difficulty: 3, translation: "Cái mũ nóng ở đây.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Happy hand, happy heart.", soundGroupId: "map-t2-g08-h", targetWords: ["happy", "hand", "heart"], targetPhonemes: ["/h/"], difficulty: 4, translation: "Tay vui, tim vui.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Hello from the house.", soundGroupId: "map-t2-g08-h", targetWords: ["hello", "house"], targetPhonemes: ["/h/"], difficulty: 3, translation: "Xin chào từ ngôi nhà.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The horse is behind the head.", soundGroupId: "map-t2-g08-h", targetWords: ["horse", "behind", "head"], targetPhonemes: ["/h/"], difficulty: 5, translation: "Con ngựa ở sau đầu.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 9: /tʃ/ & /dʒ/ (Affricates) — chair/jump
// ============================================================================

export const WORDS_T2_G09_CH_J: WordItemData[] = [
  { word: "chair", ipa: "/tʃeər/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "Sit on a chair.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "jump", ipa: "/dʒʌmp/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 3, exampleSentence: "Jump up high.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "chip", ipa: "/tʃɪp/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "Eat a chip.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "gyp", ipa: "/dʒɪp/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 4, exampleSentence: "Don't gyp your friend.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Từ hơi hiếm nhưng contrast rõ" },
  { word: "rich", ipa: "/rɪtʃ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "He is rich.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/tʃ/ cuối từ" },
  { word: "ridge", ipa: "/rɪdʒ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 3, exampleSentence: "Walk along the ridge.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/dʒ/ cuối từ" },
  { word: "watch", ipa: "/wɒtʃ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "Watch the clock.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "judge", ipa: "/dʒʌdʒ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 4, exampleSentence: "Don't judge others.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cheese", ipa: "/tʃiːz/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 2, exampleSentence: "Say cheese.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "juice", ipa: "/dʒuːs/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 2, exampleSentence: "Drink orange juice.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G09: MinimalPairData[] = [
  { word1: "chair", ipa1: "/tʃeər/", word2: "jump", ipa2: "/dʒʌmp/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 3, explanation: "/tʃ/ voiceless vs /dʒ/ voiced — affricate = stop + fricative", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /tʃ/ vs /dʒ/ (voiceless vs voiced affricate)" },
  { word1: "chip", ipa1: "/tʃɪp/", word2: "gyp", ipa2: "/dʒɪp/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, explanation: "/tʃ/ vs /dʒ/ initial trước /ɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "rich", ipa1: "/rɪtʃ/", word2: "ridge", ipa2: "/rɪdʒ/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 3, explanation: "/tʃ/ vs /dʒ/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "watch", ipa1: "/wɒtʃ/", word2: "wage", ipa2: "/weɪdʒ/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, explanation: "/tʃ/ vs /dʒ/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cheese", ipa1: "/tʃiːz/", word2: "jeez", ipa2: "/dʒiːz/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, explanation: "/tʃ/ vs /dʒ/ initial trước /iː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "chin", ipa1: "/tʃɪn/", word2: "gin", ipa2: "/dʒɪn/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 3, explanation: "/tʃ/ vs /dʒ/ initial — chữ 'ch' vs 'g/j'", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G09: SentenceItemData[] = [
  { sentence: "Jump on the chair.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["jump", "chair"], targetPhonemes: ["/dʒ/", "/tʃ/"], difficulty: 4, translation: "Nhảy lên ghế.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rich ridge, big judge.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["rich", "ridge", "judge"], targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 5, translation: "Sườn núi giàu, thẩm phán lớn.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Watch the cheese and juice.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["watch", "cheese", "juice"], targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, translation: "Trông phô mai và nước ép.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Chip the chin with gin.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["chip", "chin", "gin"], targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 5, translation: "Bẻ cằm bằng gin.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 10: /m/ /n/ /ŋ/ (Nasals) — 3 âm mũi
// ============================================================================

export const WORDS_T2_G10_NASALS: WordItemData[] = [
  { word: "man", ipa: "/mæn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/m/"], difficulty: 2, exampleSentence: "The man is tall.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ran", ipa: "/ræn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/n/"], difficulty: 2, exampleSentence: "He ran fast.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/n/ cuối từ" },
  { word: "sing", ipa: "/sɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 4, exampleSentence: "Sing a song.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ŋ/ cuối từ — người Việt hay đọc /n/" },
  { word: "sin", ipa: "/sɪn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/n/"], difficulty: 2, exampleSentence: "Avoid sin.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "thing", ipa: "/θɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 5, exampleSentence: "That thing is mine.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ŋ/ cuối + /θ/ đầu" },
  { word: "thin", ipa: "/θɪn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/n/"], difficulty: 4, exampleSentence: "The paper is thin.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ram", ipa: "/ræm/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/m/"], difficulty: 2, exampleSentence: "The ram is strong.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/m/ cuối từ" },
  { word: "rang", ipa: "/ræŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 3, exampleSentence: "She rang the bell.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "morning", ipa: "/ˈmɔːrnɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/m/", "/ŋ/"], difficulty: 4, exampleSentence: "Good morning.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/m/ đầu + /ŋ/ cuối" },
  { word: "wing", ipa: "/wɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 3, exampleSentence: "The bird's wing.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G10: MinimalPairData[] = [
  { word1: "sing", ipa1: "/sɪŋ/", word2: "sin", ipa2: "/sɪn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 4, explanation: "/ŋ/ (velar, cuối 'ng') vs /n/ (alveolar, cuối 'n') — người Việt hay đọc /ŋ/ thành /n/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp khó nhất CĐ2 cho người Việt" },
  { word1: "thing", ipa1: "/θɪŋ/", word2: "thin", ipa2: "/θɪn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 5, explanation: "/ŋ/ vs /n/ cuối + /θ/ đầu", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "rang", ipa1: "/ræŋ/", word2: "ran", ipa2: "/ræn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 3, explanation: "/ŋ/ vs /n/ cuối sau /æ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "wing", ipa1: "/wɪŋ/", word2: "win", ipa2: "/wɪn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 3, explanation: "/ŋ/ vs /n/ cuối", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "ram", ipa1: "/ræm/", word2: "ran", ipa2: "/ræn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/m/", "/n/"], difficulty: 3, explanation: "/m/ (bilabial) vs /n/ (alveolar) cuối từ", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /m/ vs /n/ (ít khó hơn /n/ vs /ŋ/)" },
  { word1: "mat", ipa1: "/mæt/", word2: "gnat", ipa2: "/næt/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/m/", "/n/"], difficulty: 4, explanation: "/m/ vs /n/ initial — gnat đọc /n/ (silent g)", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /m/ vs /n/ đầu từ" },
];

export const SENTENCES_T2_G10: SentenceItemData[] = [
  { sentence: "Sing a sin-free song.", soundGroupId: "map-t2-g10-nasals", targetWords: ["sing", "sin"], targetPhonemes: ["/ŋ/", "/n/"], difficulty: 5, translation: "Hát một bài không tội lỗi.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The thin thing is mine.", soundGroupId: "map-t2-g10-nasals", targetWords: ["thin", "thing"], targetPhonemes: ["/n/", "/ŋ/"], difficulty: 5, translation: "Vật mỏng là của tôi.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "She rang and ran.", soundGroupId: "map-t2-g10-nasals", targetWords: ["rang", "ran"], targetPhonemes: ["/ŋ/", "/n/"], difficulty: 4, translation: "Cô ấy rung chuông và chạy.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Good morning, ram wing.", soundGroupId: "map-t2-g10-nasals", targetWords: ["morning", "ram", "wing"], targetPhonemes: ["/m/", "/ŋ/"], difficulty: 5, translation: "Chào buổi sáng, cánh cừu.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 11: /l/ & /r/ (Approximants)
// ============================================================================

export const WORDS_T2_G11_L_R: WordItemData[] = [
  { word: "lip", ipa: "/lɪp/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 2, exampleSentence: "Bite your lip.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rip", ipa: "/rɪp/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Rip the paper.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/r/ tiếng Anh curled — khác 'r' Việt" },
  { word: "light", ipa: "/laɪt/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 2, exampleSentence: "Turn on the light.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "right", ipa: "/raɪt/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Turn right.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "lake", ipa: "/leɪk/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 2, exampleSentence: "Swim in the lake.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rake", ipa: "/reɪk/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Use a rake.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ball", ipa: "/bɔːl/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 3, exampleSentence: "Bounce the ball.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/l/ dark cuối từ /ɫ/" },
  { word: "bar", ipa: "/bɑːr/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Sit at the bar.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/r/ cuối từ" },
  { word: "fly", ipa: "/flaɪ/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 3, exampleSentence: "Birds fly.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/l/ cluster /fl/" },
  { word: "cry", ipa: "/kraɪ/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Don't cry.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/r/ cluster /cr/" },
];

export const MINIMAL_PAIRS_T2_G11: MinimalPairData[] = [
  { word1: "lip", ipa1: "/lɪp/", word2: "rip", ipa2: "/rɪp/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 3, explanation: "/l/ lateral vs /r/ approximant initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /l/ vs /r/" },
  { word1: "light", ipa1: "/laɪt/", word2: "right", ipa2: "/raɪt/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 3, explanation: "/l/ vs /r/ initial trước /aɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "lake", ipa1: "/leɪk/", word2: "rake", ipa2: "/reɪk/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 3, explanation: "/l/ vs /r/ initial trước /eɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "ball", ipa1: "/bɔːl/", word2: "bar", ipa2: "/bɑːr/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 4, explanation: "/l/ dark /ɫ/ vs /r/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "fly", ipa1: "/flaɪ/", word2: "fry", ipa2: "/fraɪ/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 4, explanation: "/l/ vs /r/ trong cluster /fl/ vs /fr/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cloud", ipa1: "/klaʊd/", word2: "crowd", ipa2: "/kraʊd/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 4, explanation: "/l/ vs /r/ trong cluster /kl/ vs /kr/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G11: SentenceItemData[] = [
  { sentence: "The light is right.", soundGroupId: "map-t2-g11-l-r", targetWords: ["light", "right"], targetPhonemes: ["/l/", "/r/"], difficulty: 4, translation: "Ánh sáng ở bên phải.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rip the lip.", soundGroupId: "map-t2-g11-l-r", targetWords: ["rip", "lip"], targetPhonemes: ["/r/", "/l/"], difficulty: 3, translation: "Xé môi.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rake the lake.", soundGroupId: "map-t2-g11-l-r", targetWords: ["rake", "lake"], targetPhonemes: ["/r/", "/l/"], difficulty: 4, translation: "Cào hồ.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Fly in the crowd at the bar.", soundGroupId: "map-t2-g11-l-r", targetWords: ["fly", "crowd", "bar"], targetPhonemes: ["/l/", "/r/"], difficulty: 5, translation: "Bay trong đám đông ở quán bar.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 2 - NHÓM 12: /w/ & /j/ (Approximants) — wet/yet
// ============================================================================

export const WORDS_T2_G12_W_J: WordItemData[] = [
  { word: "wet", ipa: "/wet/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "The road is wet.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/w/ — người Việt hay đọc /v/ (wine→vine)" },
  { word: "yet", ipa: "/jet/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 2, exampleSentence: "Not yet.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/j/ = 'y' Việt OK" },
  { word: "wine", ipa: "/waɪn/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "Drink red wine.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "yes", ipa: "/jes/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 1, exampleSentence: "Say yes.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "west", ipa: "/west/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "Go west.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "yell", ipa: "/jel/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 2, exampleSentence: "Don't yell at me.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "wind", ipa: "/wɪnd/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "The wind is cold.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "yeti", ipa: "/ˈjeti/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 4, exampleSentence: "The yeti is a myth.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Từ hơi hiếm nhưng /j/ rõ" },
  { word: "sweet", ipa: "/swiːt/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 3, exampleSentence: "The cake is sweet.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/w/ cluster /sw/" },
  { word: "beyond", ipa: "/bɪˈjɒnd/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 4, exampleSentence: "Look beyond.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/j/ giữa từ" },
];

export const MINIMAL_PAIRS_T2_G12: MinimalPairData[] = [
  { word1: "wet", ipa1: "/wet/", word2: "yet", ipa2: "/jet/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/j/"], difficulty: 2, explanation: "/w/ (môi tròn) vs /j/ (lưỡi cao) initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /w/ vs /j/" },
  { word1: "wine", ipa1: "/waɪn/", word2: "vine", ipa2: "/vaɪn/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/v/"], difficulty: 3, explanation: "/w/ vs /v/ — người Việt hay đọc /w/ thành /v/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp quan trọng cho người Việt (wine vs vine)" },
  { word1: "west", ipa1: "/west/", word2: "vest", ipa2: "/vest/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/v/"], difficulty: 3, explanation: "/w/ vs /v/ initial", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "will", ipa1: "/wɪl/", word2: "yell", ipa2: "/jel/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/j/"], difficulty: 3, explanation: "/w/ vs /j/ initial trước /ɪ/ /e/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /w/ vs /j/ initial sạch" },
  { word1: "sweet", ipa1: "/swiːt/", word2: "suit", ipa2: "/suːt/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/"], difficulty: 4, explanation: "/w/ cluster /sw/ — so sánh với /s/ no glide", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "worse", ipa1: "/wɜːrs/", word2: "your", ipa2: "/jɔːr/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/j/"], difficulty: 4, explanation: "/w/ vs /j/ trước /ɜːr/ /ɔːr/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G12: SentenceItemData[] = [
  { sentence: "Wet yet?", soundGroupId: "map-t2-g12-w-j", targetWords: ["wet", "yet"], targetPhonemes: ["/w/", "/j/"], difficulty: 3, translation: "Ướt chưa?", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Wine not vine.", soundGroupId: "map-t2-g12-w-j", targetWords: ["wine", "vine"], targetPhonemes: ["/w/", "/v/"], difficulty: 4, translation: "Rượu không phải dây leo.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Yes to the west.", soundGroupId: "map-t2-g12-w-j", targetWords: ["yes", "west"], targetPhonemes: ["/j/", "/w/"], difficulty: 3, translation: "Có cho phương tây.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Sweet wind beyond the yell.", soundGroupId: "map-t2-g12-w-j", targetWords: ["sweet", "wind", "beyond", "yell"], targetPhonemes: ["/w/", "/j/"], difficulty: 5, translation: "Gió ngọt phía sau tiếng hét.", status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 4 - NHÓM 1: Word Stress (CĐ4) — Mode A: tap-stress / Mode B: đọc từ
// ============================================================================

export const WORDS_T4_G01_WORD_STRESS: WordItemData[] = [
  { word: "photograph", ipa: "/ˈfoʊtəɡræf/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/əʊ/"], difficulty: 4, exampleSentence: "Take a photograph of the view.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["pho","to","graph"], stressIndex: 0, wordStressType: "WORD_STRESS", reviewNote: "Stress syllable 1 (pho) — cặp với photographer (stress shift)" },
  { word: "photographer", ipa: "/fəˈtɑɡrəfər/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/ɑː/"], difficulty: 5, exampleSentence: "She is a wedding photographer.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["pho","tog","ra","pher"], stressIndex: 1, wordStressType: "WORD_STRESS", reviewNote: "Stress syllable 2 (tog) — stress shift vs photograph" },
  { word: "balloon", ipa: "/bəˈlun/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "The balloon floats up.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["ba","lloon"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "guitar", ipa: "/ɡɪˈtɑr/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/ɑː/"], difficulty: 3, exampleSentence: "He plays the guitar.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["gui","tar"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "hotel", ipa: "/hoʊˈtɛl/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/e/"], difficulty: 3, exampleSentence: "We stayed at a hotel.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["ho","tel"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "tomorrow", ipa: "/təˈmɔroʊ/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/ɔː/"], difficulty: 4, exampleSentence: "See you tomorrow.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["to","mor","row"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "banana", ipa: "/bəˈnænə/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/æ/"], difficulty: 4, exampleSentence: "I eat a banana for breakfast.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["ba","na","na"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "computer", ipa: "/kəmˈpjutər/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/uː/"], difficulty: 4, exampleSentence: "Turn on the computer.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["com","pu","ter"], stressIndex: 1, wordStressType: "WORD_STRESS" },
];

// ============================================================================
// TOPIC 4 - NHÓM 2: Weak Forms (CĐ4) — Mode A: choose-weak / Mode B: đọc câu
// ============================================================================

export const SENTENCES_T4_G02_WEAK: SentenceItemData[] = [
  { sentence: "I'm going to the shop.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["to","the"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/aɪm ˈɡoʊɪŋ tə ðə ˈʃɑp/", translation: "Tôi đang đi tới cửa hàng.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["to","the"], acceptedAnswers: ["I'm going to the shop", "I am going to the shop"], reviewNote: "to→/tə/, the→/ðə/ weak; Mode B accept I'm/I am" },
  { sentence: "What do you want?", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["do"], targetPhonemes: ["/ə/"], difficulty: 4, ipa: "/wʌt də ju ˈwɑnt/", translation: "Bạn muốn gì?", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["do"], reviewNote: "do→/də/ weak" },
  { sentence: "Can I have a coffee?", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["a"], targetPhonemes: ["/ə/"], difficulty: 4, ipa: "/kən aɪ hæv ə ˈkɑfi/", translation: "Tôi có thể lấy một cốc cà phê không?", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["a"], reviewNote: "a→/ə/ weak" },
  { sentence: "She's at the bus stop.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["at","the"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/ʃiz ət ðə ˈbʌs stɑp/", translation: "Cô ấy ở trạm xe buýt.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["at","the"], acceptedAnswers: ["She's at the bus stop", "She is at the bus stop"], reviewNote: "at→/ət/, the→/ðə/ weak; Mode B accept She's/She is" },
  { sentence: "A cup of tea, please.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["a","of"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/ə ˈkʌp əv ˈti pliz/", translation: "Một tách trà, làm ơn.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["a","of"], reviewNote: "a→/ə/, of→/əv/ weak" },
  { sentence: "It's for you and me.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["for","and"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/ɪts fər ju ən ˈmi/", translation: "Nó dành cho bạn và tôi.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["for","and"], acceptedAnswers: ["It's for you and me", "It is for you and me"], reviewNote: "for→/fər/, and→/ən/ weak; Mode B accept It's/It is" },
  { sentence: "There is a book on the table.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["is","a","the"], targetPhonemes: ["/ə/"], difficulty: 6, ipa: "/ðɛr ɪz ə ˈbuːk ən ðə ˈteɪbəl/", translation: "Có một quyển sách trên bàn.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["is","a","the"], acceptedAnswers: ["There is a book on the table", "There's a book on the table"], reviewNote: "is/a/the weak; Mode B accept There is/There's" },
  { sentence: "What are you doing?", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["are"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/wʌt ər ju ˈduɪŋ/", translation: "Bạn đang làm gì?", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["are"], reviewNote: "are→/ər/ weak" },
];

// ============================================================================
// TOPIC 4 - NHÓM 3: Linking (CĐ4) — Mode A: choose-linking / Mode B: đọc câu
// ============================================================================

export const SENTENCES_T4_G03_LINKING: SentenceItemData[] = [
  { sentence: "Turn off the light.", soundGroupId: "map-t4-g03-linking", targetWords: ["Turn","off"], targetPhonemes: [], difficulty: 5, ipa: "/ˈtɜrn ˈɔf ðə ˈlaɪt/", translation: "Tắt đèn.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Turn","off"]], reviewNote: "C+V linking: /n/+/ɔ/ → /tɜrnˈɔf/" },
  { sentence: "Pick it up.", soundGroupId: "map-t4-g03-linking", targetWords: ["Pick","it","up"], targetPhonemes: [], difficulty: 5, ipa: "/ˈpɪk ɪt ˈʌp/", translation: "Nhấc nó lên.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Pick","it"],["it","up"]], reviewNote: "/k/+/ɪ/, /t/+/ʌ/ linking" },
  { sentence: "Look at this.", soundGroupId: "map-t4-g03-linking", targetWords: ["Look","at"], targetPhonemes: [], difficulty: 4, ipa: "/ˈlʊk ət ˈðɪs/", translation: "Nhìn cái này.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Look","at"]], reviewNote: "/k/+/ə/ linking" },
  { sentence: "Stop it now.", soundGroupId: "map-t4-g03-linking", targetWords: ["Stop","it"], targetPhonemes: [], difficulty: 4, ipa: "/ˈstɑp ɪt ˈnaʊ/", translation: "Dừng lại ngay.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Stop","it"]], reviewNote: "/p/+/ɪ/ linking" },
  { sentence: "Come in and sit down.", soundGroupId: "map-t4-g03-linking", targetWords: ["Come","in","and"], targetPhonemes: [], difficulty: 6, ipa: "/ˈkʌm ɪn ən ˈsɪt ˈdaʊn/", translation: "Vào và ngồi xuống.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Come","in"],["in","and"]], reviewNote: "/m/+/ɪ/, /n/+/ə/ linking" },
  { sentence: "Hold on a second.", soundGroupId: "map-t4-g03-linking", targetWords: ["Hold","on"], targetPhonemes: [], difficulty: 5, ipa: "/ˈhoʊld ˈɑn ə ˈsɛkənd/", translation: "Đợi một chút.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Hold","on"]], reviewNote: "/d/+/ɑ/ linking" },
  { sentence: "Take an apple.", soundGroupId: "map-t4-g03-linking", targetWords: ["Take","an","apple"], targetPhonemes: [], difficulty: 5, ipa: "/ˈteɪk ən ˈæpəl/", translation: "Lấy một quả táo.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Take","an"],["an","apple"]], reviewNote: "/k/+/ə/, /n/+/æ/ linking" },
  { sentence: "Wash up before dinner.", soundGroupId: "map-t4-g03-linking", targetWords: ["Wash","up"], targetPhonemes: [], difficulty: 6, ipa: "/ˈwɑʃ ˈʌp bɪˈfɔr ˈdɪnər/", translation: "Rửa tay trước bữa tối.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Wash","up"]], reviewNote: "/ʃ/+/ʌ/ linking" },
];

// ============================================================================
// TOPIC 4 - NHÓM 4: Assimilation & Elision (CĐ4) — Mode A: choose-assimilation / Mode B: đọc câu
// ============================================================================

export const SENTENCES_T4_G04_ASSIM: SentenceItemData[] = [
  { sentence: "Did you see it?", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Did","you"], targetPhonemes: [], difficulty: 6, ipa: "/dɪdʒu si ɪt/", translation: "Bạn có thấy nó không?", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "dj→dʒ", assimOriginal: "/dɪd ju/", assimResult: "/dɪdʒu/", reviewNote: "/d/+/j/→/dʒ/: did you → didja" },
  { sentence: "Nice to meet you.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["meet","you"], targetPhonemes: [], difficulty: 6, ipa: "/naɪs tə mitʃu/", translation: "Vui được gặp bạn.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "tj→tʃ", assimOriginal: "/mit ju/", assimResult: "/mitʃu/", reviewNote: "/t/+/j/→/tʃ/: meet you → meetcha" },
  { sentence: "Would you like tea?", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Would","you"], targetPhonemes: [], difficulty: 6, ipa: "/wʊdʒu laɪk ti/", translation: "Bạn có muốn trà không?", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "dj→dʒ", assimOriginal: "/wʊd ju/", assimResult: "/wʊdʒu/", reviewNote: "/d/+/j/→/dʒ/: would you → wouldja" },
  { sentence: "I got your back.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["got","your"], targetPhonemes: [], difficulty: 6, ipa: "/aɪ ɡɑtʃər bæk/", translation: "Tôi ủng hộ bạn.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "tj→tʃ", assimOriginal: "/ɡɑt jɔr/", assimResult: "/ɡɑtʃər/", reviewNote: "/t/+/j/→/tʃ/: got your → gotcha" },
  { sentence: "Next day, we leave.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Next","day"], targetPhonemes: [], difficulty: 7, ipa: "/nɛks deɪ wi liv/", translation: "Hôm sau, chúng tôi rời đi.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "elision-t", assimOriginal: "/nɛkst deɪ/", assimResult: "/nɛks deɪ/", reviewNote: "Elision: drop /t/ in 'next' before /d/" },
  { sentence: "Just you and me.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Just","you"], targetPhonemes: [], difficulty: 6, ipa: "/dʒʌs tʃu ən mi/", translation: "Chỉ bạn và tôi.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "tj→tʃ", assimOriginal: "/dʒʌst ju/", assimResult: "/dʒʌs tʃu/", reviewNote: "/t/+/j/→/tʃ/ + elision overlap" },
  { sentence: "Hand your coat over.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Hand","your"], targetPhonemes: [], difficulty: 7, ipa: "/hændʒər koʊt oʊvər/", translation: "Đưa áo khoác lại đây.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "dj→dʒ", assimOriginal: "/hænd jɔr/", assimResult: "/hændʒər/", reviewNote: "/d/+/j/→/dʒ/: hand your → handjer" },
  { sentence: "Last chance, go!", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Last","chance"], targetPhonemes: [], difficulty: 7, ipa: "/læs tʃæns ɡoʊ/", translation: "Cơ hội cuối, đi đi!", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "elision-t", assimOriginal: "/læst tʃæns/", assimResult: "/læs tʃæns/", reviewNote: "Elision: drop /t/ in 'last' before /tʃ/" },
];

// ============================================================================
// TOPIC 3 - NHÓM 2: Phụ âm đầu từ dễ nhầm /l/ vs /r/ vs /n/ (CĐ3)
// ============================================================================

export const WORDS_T3_G02_INITIAL_CONFUSE: WordItemData[] = [
  {
    word: "light",
    ipa: "/laɪt/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/l/"],
    difficulty: 5,
    exampleSentence: "Turn on the light please.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm /l/ đầu từ, người Việt hay nhầm với /n/",
  },
  {
    word: "right",
    ipa: "/raɪt/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/r/"],
    difficulty: 6,
    exampleSentence: "That answer is right.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm /r/ đầu từ - khó nhất với người Việt",
  },
  {
    word: "night",
    ipa: "/naɪt/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/n/"],
    difficulty: 4,
    exampleSentence: "Good night, sleep well.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm /n/ đầu từ - dễ nhất trong ba âm",
  },
  {
    word: "long",
    ipa: "/lɒŋ/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/l/"],
    difficulty: 5,
    exampleSentence: "It's a long way home.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "wrong",
    ipa: "/rɒŋ/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/r/"],
    difficulty: 6,
    exampleSentence: "That answer is wrong.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Chú ý: /r/ + /ɒ/ + /ŋ/ cuối",
  },
  {
    word: "none",
    ipa: "/nʌn/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/n/"],
    difficulty: 5,
    exampleSentence: "None of them came.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "lead",
    ipa: "/liːd/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/l/"],
    difficulty: 5,
    exampleSentence: "Please lead the way.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "need",
    ipa: "/niːd/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/n/"],
    difficulty: 4,
    exampleSentence: "I need some help.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "low",
    ipa: "/ləʊ/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/l/"],
    difficulty: 5,
    exampleSentence: "The price is too low.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "row",
    ipa: "/rəʊ/",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetPhonemes: ["/r/"],
    difficulty: 6,
    exampleSentence: "Row the boat slowly.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const MINIMAL_PAIRS_T3_G02: MinimalPairData[] = [
  {
    word1: "light",
    ipa1: "/laɪt/",
    word2: "right",
    ipa2: "/raɪt/",
    soundGroupId: "map-t3-g02-initial-confuse",
    contrastPhonemes: ["/l/", "/r/"],
    difficulty: 8,
    explanation: "/l/ chạm lưỡi lên răng trên, /r/ cuộn lưỡi vào trong",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Cặp cổ điển /l/ vs /r/",
  },
  {
    word1: "long",
    ipa1: "/lɒŋ/",
    word2: "wrong",
    ipa2: "/rɒŋ/",
    soundGroupId: "map-t3-g02-initial-confuse",
    contrastPhonemes: ["/l/", "/r/"],
    difficulty: 8,
    explanation: "Cùng vần /ɒŋ/, chỉ khác phụ âm đầu",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "light",
    ipa1: "/laɪt/",
    word2: "night",
    ipa2: "/naɪt/",
    soundGroupId: "map-t3-g02-initial-confuse",
    contrastPhonemes: ["/l/", "/n/"],
    difficulty: 6,
    explanation: "/l/ lateral (lưỡi chạm răng), /n/ nasal (âm mũi)",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "lead",
    ipa1: "/liːd/",
    word2: "need",
    ipa2: "/niːd/",
    soundGroupId: "map-t3-g02-initial-confuse",
    contrastPhonemes: ["/l/", "/n/"],
    difficulty: 6,
    explanation: "Cùng vần /iːd/, khác /l/ vs /n/",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "low",
    ipa1: "/ləʊ/",
    word2: "row",
    ipa2: "/rəʊ/",
    soundGroupId: "map-t3-g02-initial-confuse",
    contrastPhonemes: ["/l/", "/r/"],
    difficulty: 7,
    explanation: "Cùng vần /əʊ/, khác phụ âm đầu",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "right",
    ipa1: "/raɪt/",
    word2: "night",
    ipa2: "/naɪt/",
    soundGroupId: "map-t3-g02-initial-confuse",
    contrastPhonemes: ["/r/", "/n/"],
    difficulty: 7,
    explanation: "/r/ cuộn lưỡi, /n/ chạm răng + mũi",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const SENTENCES_T3_G02: SentenceItemData[] = [
  {
    sentence: "The light on the right side is bright at night.",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetWords: ["light", "right", "night"],
    targetPhonemes: ["/l/", "/r/", "/n/"],
    difficulty: 8,
    ipa: "/ðə laɪt ɒn ðə raɪt saɪd ɪz braɪt æt naɪt/",
    translation: "Ánh sáng phía bên phải sáng rực vào ban đêm.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Câu chứa cả 3 âm mục tiêu /l/, /r/, /n/",
  },
  {
    sentence: "Long rows of wrong notes ruined the song.",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetWords: ["Long", "rows", "wrong", "notes"],
    targetPhonemes: ["/l/", "/r/", "/n/"],
    difficulty: 9,
    ipa: "/lɒŋ rəʊz ɒv rɒŋ nəʊts ˈruːɪnd ðə sɒŋ/",
    translation: "Những hàng dài nốt sai làm hỏng bài hát.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "No one needs to lead the way at night.",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetWords: ["No", "needs", "lead", "night"],
    targetPhonemes: ["/n/", "/l/"],
    difficulty: 7,
    ipa: "/nəʊ wʌn niːdz tə liːd ðə weɪ æt naɪt/",
    translation: "Không ai cần dẫn đường vào ban đêm.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "Leave the red ribbon on the lawn, Ron.",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetWords: ["Leave", "red", "ribbon", "lawn", "Ron"],
    targetPhonemes: ["/l/", "/r/", "/n/"],
    difficulty: 8,
    ipa: "/liːv ðə rɛd ˈrɪbən ɒn ðə lɒn rɒn/",
    translation: "Để dải ruy băng đỏ trên bãi cỏ, Ron.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Luyện phân biệt /l/, /r/, /n/ trong câu tự nhiên",
  },
  {
    sentence: "Neil really loves running long races.",
    soundGroupId: "map-t3-g02-initial-confuse",
    targetWords: ["Neil", "really", "loves", "running", "long", "races"],
    targetPhonemes: ["/n/", "/r/", "/l/"],
    difficulty: 8,
    ipa: "/niːl ˈrɪəli lʌvz ˈrʌnɪŋ lɒŋ ˈreɪsɪz/",
    translation: "Neil thực sự thích chạy những cuộc đua dài.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

// ============================================================================
// TOPIC 3 - NHÓM 4: Âm răng & âm xát /θ/ vs /s/ vs /t/, /ð/ vs /z/ vs /d/ (CĐ3)
// ============================================================================

export const WORDS_T3_G04_DENTAL_SIBILANT: WordItemData[] = [
  {
    word: "think",
    ipa: "/θɪŋk/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/θ/"],
    difficulty: 8,
    exampleSentence: "I think this is correct.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm răng /θ/ - khó nhất với người Việt",
  },
  {
    word: "sink",
    ipa: "/sɪŋk/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/s/"],
    difficulty: 4,
    exampleSentence: "The ship began to sink.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm xát /s/ - người Việt hay nhầm với /θ/",
  },
  {
    word: "thin",
    ipa: "/θɪn/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/θ/"],
    difficulty: 8,
    exampleSentence: "The ice is very thin.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "sin",
    ipa: "/sɪn/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/s/"],
    difficulty: 4,
    exampleSentence: "It's a sin to waste food.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "this",
    ipa: "/ðɪs/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/ð/"],
    difficulty: 7,
    exampleSentence: "This is my book.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm răng hữu thanh /ð/",
  },
  {
    word: "these",
    ipa: "/ðiːz/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/ð/"],
    difficulty: 7,
    exampleSentence: "These are my friends.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "three",
    ipa: "/θriː/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/θ/"],
    difficulty: 9,
    exampleSentence: "I have three books.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Khó nhất: /θ/ + /r/ liên tiếp",
  },
  {
    word: "tree",
    ipa: "/triː/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/t/"],
    difficulty: 4,
    exampleSentence: "The tree is tall.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm tắc /t/ - người Việt hay thay /θ/ bằng /t/",
  },
  {
    word: "they",
    ipa: "/ðeɪ/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/ð/"],
    difficulty: 7,
    exampleSentence: "They are coming soon.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word: "day",
    ipa: "/deɪ/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetPhonemes: ["/d/"],
    difficulty: 3,
    exampleSentence: "What a beautiful day!",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Âm tắc /d/ - dễ, nhưng hay nhầm với /ð/",
  },
];

export const MINIMAL_PAIRS_T3_G04: MinimalPairData[] = [
  {
    word1: "think",
    ipa1: "/θɪŋk/",
    word2: "sink",
    ipa2: "/sɪŋk/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    contrastPhonemes: ["/θ/", "/s/"],
    difficulty: 9,
    explanation: "/θ/ đặt lưỡi giữa răng, /s/ để lưỡi sau răng",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Cặp kinh điển nhất cho âm răng vs xát",
  },
  {
    word1: "thin",
    ipa1: "/θɪn/",
    word2: "sin",
    ipa2: "/sɪn/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    contrastPhonemes: ["/θ/", "/s/"],
    difficulty: 9,
    explanation: "Cùng vần /ɪn/, khác phụ âm đầu",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "three",
    ipa1: "/θriː/",
    word2: "tree",
    ipa2: "/triː/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    contrastPhonemes: ["/θ/", "/t/"],
    difficulty: 10,
    explanation: "Cực khó: /θr/ vs /tr/ - người Việt hay bỏ /θ/ thành /t/",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Cặp khó nhất trong nhóm",
  },
  {
    word1: "thought",
    ipa1: "/θɔːt/",
    word2: "taught",
    ipa2: "/tɔːt/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    contrastPhonemes: ["/θ/", "/t/"],
    difficulty: 9,
    explanation: "Cùng vần /ɔːt/, khác phụ âm đầu",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "they",
    ipa1: "/ðeɪ/",
    word2: "day",
    ipa2: "/deɪ/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    contrastPhonemes: ["/ð/", "/d/"],
    difficulty: 7,
    explanation: "/ð/ đặt lưỡi giữa răng + rung, /d/ chạm lưỡi sau răng",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    word1: "then",
    ipa1: "/ðen/",
    word2: "den",
    ipa2: "/den/",
    soundGroupId: "map-t3-g04-dental-sibilant",
    contrastPhonemes: ["/ð/", "/d/"],
    difficulty: 7,
    explanation: "Cùng vần /en/, khác /ð/ vs /d/",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
];

export const SENTENCES_T3_G04: SentenceItemData[] = [
  {
    sentence: "I think they sank the ship.",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetWords: ["think", "they", "sank", "ship"],
    targetPhonemes: ["/θ/", "/ð/", "/s/"],
    difficulty: 9,
    ipa: "/aɪ θɪŋk ðeɪ sæŋk ðə ʃɪp/",
    translation: "Tôi nghĩ họ đã đánh chìm con tàu.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Câu luyện phân biệt /θ/, /ð/, /s/ trong cùng ngữ cảnh",
  },
  {
    sentence: "Three trees are thinner than this one.",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetWords: ["Three", "trees", "thinner", "this"],
    targetPhonemes: ["/θ/", "/t/", "/ð/"],
    difficulty: 10,
    ipa: "/θriː triːz ɑːr ˈθɪnər ðæn ðɪs wʌn/",
    translation: "Ba cái cây mảnh hơn cái này.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Câu cực khó: /θr/ cluster + /t/ + /ð/",
  },
  {
    sentence: "They said those things on Thursday.",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetWords: ["They", "said", "those", "things", "Thursday"],
    targetPhonemes: ["/ð/", "/θ/", "/s/"],
    difficulty: 9,
    ipa: "/ðeɪ sɛd ðəʊz θɪŋz ɒn ˈθɜːzdeɪ/",
    translation: "Họ nói những điều đó vào thứ Năm.",
    status: "ACTIVE",
    sourceType: "MANUAL",
  },
  {
    sentence: "The thin thief thought about the truth.",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetWords: ["thin", "thief", "thought", "truth"],
    targetPhonemes: ["/θ/", "/t/"],
    difficulty: 9,
    ipa: "/ðə θɪn θiːf θɔːt əbaʊt ðə truːθ/",
    translation: "Tên trộm gầy nghĩ về sự thật.",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Luyện /θ/ liên tiếp ở nhiều vị trí",
  },
  {
    sentence: "Does that zoo have zebras and deer?",
    soundGroupId: "map-t3-g04-dental-sibilant",
    targetWords: ["Does", "that", "zoo", "zebras", "deer"],
    targetPhonemes: ["/ð/", "/z/", "/d/"],
    difficulty: 8,
    ipa: "/dʌz ðæt zuː hæv ˈzɛbrəz ənd dɪər/",
    translation: "Sở thú đó có ngựa vằn và hươu không?",
    status: "ACTIVE",
    sourceType: "MANUAL",
    reviewNote: "Luyện phân biệt /ð/, /z/, /d/ trong câu hỏi",
  },
];

// EXPORTS - Tổng hợp theo sound group
// ============================================================================

export const LESSON_CONTENT_BY_SOUND_GROUP = {
  "map-t1-g01-i-ih": {
    words: WORDS_T1_G01_I_IH,
    minimalPairs: MINIMAL_PAIRS_T1_G01,
    sentences: SENTENCES_T1_G01,
  },
  "map-t1-g02-e-ae": {
    words: WORDS_T1_G02_E_AE,
    minimalPairs: MINIMAL_PAIRS_T1_G02,
    sentences: SENTENCES_T1_G02,
  },
  "map-t1-g04-o-oh": {
    words: WORDS_T1_G04_O_OH,
    minimalPairs: MINIMAL_PAIRS_T1_G04,
    sentences: SENTENCES_T1_G04,
  },
  "map-t3-g01-front-vowel-mix": {
    words: WORDS_T4_G01_FRONT_MIX,
    minimalPairs: MINIMAL_PAIRS_T4_G01,
    sentences: SENTENCES_T4_G01,
  },
  "map-t3-g03-final-drop": {
    words: WORDS_T4_G03_FINAL,
    minimalPairs: MINIMAL_PAIRS_T4_G03,
    sentences: SENTENCES_T4_G03,
  },
  "map-t1-g03-central": {
    words: WORDS_T1_G03_CENTRAL,
    minimalPairs: MINIMAL_PAIRS_T1_G03,
    sentences: SENTENCES_T1_G03,
  },
  "map-t1-g05-u-uh": {
    words: WORDS_T1_G05_U_UH,
    minimalPairs: MINIMAL_PAIRS_T1_G05,
    sentences: SENTENCES_T1_G05,
  },
  "map-t1-g06-er": {
    words: WORDS_T1_G06_ER,
    minimalPairs: MINIMAL_PAIRS_T1_G06,
    sentences: SENTENCES_T1_G06,
  },
  "map-t1-g07-ei-ai": {
    words: WORDS_T1_G07_EI_AI,
    minimalPairs: MINIMAL_PAIRS_T1_G07,
    sentences: SENTENCES_T1_G07,
  },
  "map-t1-g08-oi-au": {
    words: WORDS_T1_G08_OI_AU,
    minimalPairs: MINIMAL_PAIRS_T1_G08,
    sentences: SENTENCES_T1_G08,
  },
  "map-t1-g09-ou-ea": {
    words: WORDS_T1_G09_OU_EA,
    minimalPairs: MINIMAL_PAIRS_T1_G09,
    sentences: SENTENCES_T1_G09,
  },
  "map-t1-g10-ia-ua": {
    words: WORDS_T1_G10_IA_UA,
    minimalPairs: MINIMAL_PAIRS_T1_G10,
    sentences: SENTENCES_T1_G10,
  },

  "map-t2-g01-p-b": {
    words: WORDS_T2_G01_P_B,
    minimalPairs: MINIMAL_PAIRS_T2_G01,
    sentences: SENTENCES_T2_G01,
  },
  "map-t2-g02-t-d": {
    words: WORDS_T2_G02_T_D,
    minimalPairs: MINIMAL_PAIRS_T2_G02,
    sentences: SENTENCES_T2_G02,
  },
  "map-t2-g03-k-g": {
    words: WORDS_T2_G03_K_G,
    minimalPairs: MINIMAL_PAIRS_T2_G03,
    sentences: SENTENCES_T2_G03,
  },
  "map-t2-g04-f-v": {
    words: WORDS_T2_G04_F_V,
    minimalPairs: MINIMAL_PAIRS_T2_G04,
    sentences: SENTENCES_T2_G04,
  },
  "map-t2-g05-th-dh": {
    words: WORDS_T2_G05_TH_DH,
    minimalPairs: MINIMAL_PAIRS_T2_G05,
    sentences: SENTENCES_T2_G05,
  },
  "map-t2-g06-s-z": {
    words: WORDS_T2_G06_S_Z,
    minimalPairs: MINIMAL_PAIRS_T2_G06,
    sentences: SENTENCES_T2_G06,
  },
  "map-t2-g07-sh-zh": {
    words: WORDS_T2_G07_SH_ZH,
    minimalPairs: MINIMAL_PAIRS_T2_G07,
    sentences: SENTENCES_T2_G07,
  },
  "map-t2-g08-h": {
    words: WORDS_T2_G08_H,
    minimalPairs: MINIMAL_PAIRS_T2_G08,
    sentences: SENTENCES_T2_G08,
  },
  "map-t2-g09-ch-j": {
    words: WORDS_T2_G09_CH_J,
    minimalPairs: MINIMAL_PAIRS_T2_G09,
    sentences: SENTENCES_T2_G09,
  },
  "map-t2-g10-nasals": {
    words: WORDS_T2_G10_NASALS,
    minimalPairs: MINIMAL_PAIRS_T2_G10,
    sentences: SENTENCES_T2_G10,
  },
  "map-t2-g11-l-r": {
    words: WORDS_T2_G11_L_R,
    minimalPairs: MINIMAL_PAIRS_T2_G11,
    sentences: SENTENCES_T2_G11,
  },
  "map-t2-g12-w-j": {
    words: WORDS_T2_G12_W_J,
    minimalPairs: MINIMAL_PAIRS_T2_G12,
    sentences: SENTENCES_T2_G12,
  },
  "map-t3-g02-initial-confuse": {
    words: WORDS_T3_G02_INITIAL_CONFUSE,
    minimalPairs: MINIMAL_PAIRS_T3_G02,
    sentences: SENTENCES_T3_G02,
  },
  "map-t3-g04-dental-sibilant": {
    words: WORDS_T3_G04_DENTAL_SIBILANT,
    minimalPairs: MINIMAL_PAIRS_T3_G04,
    sentences: SENTENCES_T3_G04,
  },
  "map-t4-g01-word-stress": {
    words: WORDS_T4_G01_WORD_STRESS,
    minimalPairs: [],
    sentences: [],
  },
  "map-t4-g02-weak-forms": {
    words: [],
    minimalPairs: [],
    sentences: SENTENCES_T4_G02_WEAK,
  },
  "map-t4-g03-linking": {
    words: [],
    minimalPairs: [],
    sentences: SENTENCES_T4_G03_LINKING,
  },
  "map-t4-g04-assimilation": {
    words: [],
    minimalPairs: [],
    sentences: SENTENCES_T4_G04_ASSIM,
  },
};

// Helper để lấy content theo sound group
export function getContentBySoundGroup(soundGroupId: string) {
  return LESSON_CONTENT_BY_SOUND_GROUP[soundGroupId as keyof typeof LESSON_CONTENT_BY_SOUND_GROUP];
}

// Stats
const totalWords = Object.values(LESSON_CONTENT_BY_SOUND_GROUP).reduce((sum, group) => sum + group.words.length, 0);
const totalPairs = Object.values(LESSON_CONTENT_BY_SOUND_GROUP).reduce((sum, group) => sum + group.minimalPairs.length, 0);
const totalSentences = Object.values(LESSON_CONTENT_BY_SOUND_GROUP).reduce((sum, group) => sum + group.sentences.length, 0);

console.log(`📝 Lesson Content loaded:`);
console.log(`   - ${Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length} Sound Groups with data`);
console.log(`   - ${totalWords} Words`);
console.log(`   - ${totalPairs} Minimal Pairs`);
console.log(`   - ${totalSentences} Sentences`);
console.log(`   - 38 Sound Groups ready (30 original + 8 animal supplements)`);
