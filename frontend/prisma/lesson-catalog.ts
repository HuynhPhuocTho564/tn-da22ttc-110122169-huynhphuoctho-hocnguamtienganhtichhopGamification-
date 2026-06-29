/**
 * LESSON CATALOG v2 - Nguồn cấu hình duy nhất cho 4 chủ đề, 30 nhóm âm, 112 bài
 *
 * Cấu trúc (theo LESSON_SYLLABUS_STRUCTURE.md):
 * - 4 Topics (Chủ đề) với unlock tuần tự 80%
 * - 30 Sound Groups (10 vowels + 12 consonants + 4 minimal-pairs-hard + 4 stress-connected)
 * - 6 Exercise Modes (4 chuẩn cho CĐ1-3 + 2 đặc thù cho CĐ4)
 * - Tổng: 26 nhóm × 4 mode + 4 nhóm × 2 mode = 112 bài
 *
 * Unlock: CĐ1 mở tự do; CĐ2/3/4 mở khi topic trước hoàn thành ≥80% (trường unlockThresholdPercent).
 *
 * Nguyên tắc: không code 112 bài thủ công. Seed từ catalog -> generate Exercise.
 */

export type TopicDefinition = {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  unlockThresholdPercent: number; // 0 = mở tự do
  totalSoundGroups: number;
  color: string;
};

export type PhonemeDefinition = {
  ipa: string;
  type: "MONOPHTHONG" | "DIPHTHONG" | "CONSONANT";
  description: string;
  exampleWords: string[];
};

export type SoundGroupDefinition = {
  id: string;
  topicId: string;
  name: string;
  description: string;
  orderIndex: number;
  targetPhonemes: string[];
  difficulty: number;
  notes: string;
  subcategory: string | null; // v2: nhóm con trong topic (vd "Nguyên âm đơn", "Plosives"). null = không phân nhóm.
};

export type ExerciseModeDefinition = {
  id: string;
  name: string;
  description: string;
  questionTypeId: string;
  orderIndex: number;
  icon: string;
  appliesToTopics: string[]; // topic id áp dụng mode này
};

// ============================================================================
// TOPICS (4 chủ đề, unlock tuần tự 80%)
// ============================================================================

export const TOPICS: TopicDefinition[] = [
  {
    id: "topic-1-vowels",
    name: "Nguyên âm",
    description: "Nền tảng phát âm - 10 nhóm nguyên âm (6 đơn + 4 đôi)",
    orderIndex: 1,
    unlockThresholdPercent: 0,
    totalSoundGroups: 10,
    color: "blue",
  },
  {
    id: "topic-2-consonants",
    name: "Phụ âm",
    description: "12 nhóm phụ âm theo 5 tầng (Plosives/Fricatives/Affricates/Nasals/Approximants)",
    orderIndex: 2,
    unlockThresholdPercent: 80,
    totalSoundGroups: 12,
    color: "orange",
  },
  {
    id: "topic-3-minimal-pairs-hard",
    name: "Minimal Pairs Khó",
    description: "Tổng hợp 4 nhóm cặp âm dễ nhầm nhất (mở khóa sau CĐ2 ≥80%)",
    orderIndex: 3,
    unlockThresholdPercent: 80,
    totalSoundGroups: 4,
    color: "red",
  },
  {
    id: "topic-4-stress-connected",
    name: "Trọng âm & Nối âm",
    description: "4 nhóm đặc thù: Word Stress, Weak Forms, Linking, Assimilation (mở khóa sau CĐ3 ≥80%)",
    orderIndex: 4,
    unlockThresholdPercent: 80,
    totalSoundGroups: 4,
    color: "purple",
  },
];

// ============================================================================
// EXERCISE MODES (6: 4 chuẩn cho CĐ1-3 + 2 đặc thù cho CĐ4)
// ============================================================================

const STANDARD_TOPIC_IDS = ["topic-1-vowels", "topic-2-consonants", "topic-3-minimal-pairs-hard"];
const STRESS_TOPIC_IDS = ["topic-4-stress-connected"];

export const EXERCISE_MODES: ExerciseModeDefinition[] = [
  {
    id: "listen_choose",
    name: "Luyện tai",
    description: "Nghe và chọn IPA/từ đúng",
    questionTypeId: "qtype-1-mc",
    orderIndex: 1,
    icon: "👂",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "speak_word",
    name: "Luyện miệng",
    description: "Đọc từ đơn theo IPA",
    questionTypeId: "qtype-2-voice",
    orderIndex: 2,
    icon: "🗣️",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "speak_minimal_pair",
    name: "Thử thách kép",
    description: "Đọc cặp từ dễ nhầm lẫn",
    questionTypeId: "qtype-3-minimal-pairs",
    orderIndex: 3,
    icon: "⚔️",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "speak_sentence",
    name: "Thực chiến",
    description: "Đọc câu có chứa âm mục tiêu",
    questionTypeId: "qtype-2-voice",
    orderIndex: 4,
    icon: "🎯",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "mode_a_listen_choose",
    name: "Nghe & Chọn",
    description: "Mode A đặc thù CĐ4: nghe → chọn (tap stress / weak form / linking / assimilation)",
    questionTypeId: "qtype-2-voice", // placeholder, mỗi nhóm CĐ4 override questionTypeId cụ thể khi seed (SP3)
    orderIndex: 5,
    icon: "🎧",
    appliesToTopics: STRESS_TOPIC_IDS,
  },
  {
    id: "mode_b_speak_match",
    name: "Đọc & So khớp",
    description: "Mode B đặc thù CĐ4: đọc → so khớp nhiều dạng (acceptedAnswers)",
    questionTypeId: "qtype-2-voice",
    orderIndex: 6,
    icon: "🗣️",
    appliesToTopics: STRESS_TOPIC_IDS,
  },
];

// ============================================================================
// SOUND GROUPS (30 nhóm)
// ============================================================================

export const SOUND_GROUPS: SoundGroupDefinition[] = [
  // --- CĐ1 NGUYÊN ÂM (10 nhóm: 6 đơn + 4 đôi) ---
  { id: "map-t1-g01-i-ih", topicId: "topic-1-vowels", name: "/iː/ & /ɪ/", description: "Dài & ngắn phía trước (ship/sheep)", orderIndex: 1, targetPhonemes: ["/iː/", "/ɪ/"], difficulty: 3, notes: "Cặp cơ bản nhất", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g02-e-ae", topicId: "topic-1-vowels", name: "/e/ & /æ/", description: "Hẹp & mở phía trước (bed/bad)", orderIndex: 2, targetPhonemes: ["/e/", "/æ/"], difficulty: 4, notes: "Người Việt hay gộp /æ/ thành /e/", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g03-central", topicId: "topic-1-vowels", name: "/ɑː/ & /ʌ/ & /ə/", description: "Nhóm trung tâm (father/fun/about)", orderIndex: 3, targetPhonemes: ["/ɑː/", "/ʌ/", "/ə/"], difficulty: 5, notes: "Ba âm trung tâm", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g04-o-oh", topicId: "topic-1-vowels", name: "/ɒ/ & /ɔː/", description: "Tròn ngắn & tròn dài (hot/horse)", orderIndex: 4, targetPhonemes: ["/ɒ/", "/ɔː/"], difficulty: 4, notes: "Âm tròn môi", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g05-u-uh", topicId: "topic-1-vowels", name: "/ʊ/ & /uː/", description: "Sau ngắn & sau dài (full/fool)", orderIndex: 5, targetPhonemes: ["/ʊ/", "/uː/"], difficulty: 3, notes: "Cặp âm sau", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g06-er", topicId: "topic-1-vowels", name: "/ɜː/", description: "Âm giữa đặc biệt (bird/word)", orderIndex: 6, targetPhonemes: ["/ɜː/"], difficulty: 6, notes: "Không có trong tiếng Việt", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g07-ei-ai", topicId: "topic-1-vowels", name: "/eɪ/ & /aɪ/", description: "Kết thúc bằng /ɪ/ (day/die)", orderIndex: 7, targetPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, notes: "Âm trượt phổ biến", subcategory: "Nguyên âm đôi" },
  { id: "map-t1-g08-oi-au", topicId: "topic-1-vowels", name: "/ɔɪ/ & /aʊ/", description: "/ɔɪ/ lên, /aʊ/ xuống-lên (boy/now)", orderIndex: 8, targetPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 5, notes: "Hướng di chuyển âm", subcategory: "Nguyên âm đôi" },
  { id: "map-t1-g09-ou-ea", topicId: "topic-1-vowels", name: "/əʊ/ & /eə/", description: "Nhóm trung tâm (go/air)", orderIndex: 9, targetPhonemes: ["/əʊ/", "/eə/"], difficulty: 6, notes: "Âm trượt từ/tới schwa", subcategory: "Nguyên âm đôi" },
  { id: "map-t1-g10-ia-ua", topicId: "topic-1-vowels", name: "/ɪə/ & /ʊə/", description: "Kết thúc bằng schwa (ear/tour)", orderIndex: 10, targetPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 7, notes: "Âm khó, ít gặp", subcategory: "Nguyên âm đôi" },

  // --- CĐ2 PHỤ ÂM (12 nhóm theo 5 tầng) ---
  // Tầng 1 Plosives
  { id: "map-t2-g01-p-b", topicId: "topic-2-consonants", name: "/p/ & /b/", description: "Bilabial - hai môi (pen/ben)", orderIndex: 1, targetPhonemes: ["/p/", "/b/"], difficulty: 2, notes: "Cặp vô thanh/hữu thanh cơ bản", subcategory: "Plosives" },
  { id: "map-t2-g02-t-d", topicId: "topic-2-consonants", name: "/t/ & /d/", description: "Alveolar tắc (tea/day)", orderIndex: 2, targetPhonemes: ["/t/", "/d/"], difficulty: 3, notes: "Người Việt hay nuốt /t/ /d/ cuối", subcategory: "Plosives" },
  { id: "map-t2-g03-k-g", topicId: "topic-2-consonants", name: "/k/ & /g/", description: "Velar (cat/got)", orderIndex: 3, targetPhonemes: ["/k/", "/g/"], difficulty: 3, notes: "Âm từ vòm mềm", subcategory: "Plosives" },
  // Tầng 2 Fricatives
  { id: "map-t2-g04-f-v", topicId: "topic-2-consonants", name: "/f/ & /v/", description: "Labiodental (fan/van)", orderIndex: 4, targetPhonemes: ["/f/", "/v/"], difficulty: 4, notes: "Người Việt nhầm /v/ thành /w/", subcategory: "Fricatives" },
  { id: "map-t2-g05-th-dh", topicId: "topic-2-consonants", name: "/θ/ & /ð/", description: "Dental - đặt lưỡi giữa răng (think/this)", orderIndex: 5, targetPhonemes: ["/θ/", "/ð/"], difficulty: 8, notes: "Khó nhất người Việt, không có âm răng", subcategory: "Fricatives" },
  { id: "map-t2-g06-s-z", topicId: "topic-2-consonants", name: "/s/ & /z/", description: "Alveolar xát (see/zoo)", orderIndex: 6, targetPhonemes: ["/s/", "/z/"], difficulty: 3, notes: "/z/ ít gặp trong tiếng Việt", subcategory: "Fricatives" },
  { id: "map-t2-g07-sh-zh", topicId: "topic-2-consonants", name: "/ʃ/ & /ʒ/", description: "Post-alveolar (ship/measure)", orderIndex: 7, targetPhonemes: ["/ʃ/", "/ʒ/"], difficulty: 5, notes: "/ʒ/ rất hiếm", subcategory: "Fricatives" },
  { id: "map-t2-g08-h", topicId: "topic-2-consonants", name: "/h/", description: "Glottal - thanh hầu (he/hot)", orderIndex: 8, targetPhonemes: ["/h/"], difficulty: 3, notes: "Không có cặp vô thanh/hữu thanh", subcategory: "Fricatives" },
  // Tầng 3 Affricates
  { id: "map-t2-g09-ch-j", topicId: "topic-2-consonants", name: "/tʃ/ & /dʒ/", description: "Affricate post-alveolar (chair/job)", orderIndex: 9, targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, notes: "Âm kép", subcategory: "Affricates" },
  // Tầng 4 Nasals
  { id: "map-t2-g10-nasals", topicId: "topic-2-consonants", name: "/m/ & /n/ & /ŋ/", description: "Âm mũi (man/now/sing)", orderIndex: 10, targetPhonemes: ["/m/", "/n/", "/ŋ/"], difficulty: 3, notes: "/ŋ/ cuối từ không thêm /g/", subcategory: "Nasals" },
  // Tầng 5 Approximants
  { id: "map-t2-g11-l-r", topicId: "topic-2-consonants", name: "/l/ & /r/", description: "Liquids (light/right)", orderIndex: 11, targetPhonemes: ["/l/", "/r/"], difficulty: 7, notes: "Khó nhất người Việt, /r/ cần uốn lưỡi", subcategory: "Approximants" },
  { id: "map-t2-g12-w-j", topicId: "topic-2-consonants", name: "/w/ & /j/", description: "Glides - bán nguyên âm (we/yes)", orderIndex: 12, targetPhonemes: ["/w/", "/j/"], difficulty: 4, notes: "Người Việt nhầm /w/ với /v/, /j/ với /dʒ/", subcategory: "Approximants" },

  // --- CĐ3 MINIMAL PAIRS KHÓ (4 nhóm) ---
  { id: "map-t3-g01-front-vowel-mix", topicId: "topic-3-minimal-pairs-hard", name: "Nguyên âm phía trước dễ nhầm", description: "/iː/ vs /ɪ/ vs /e/ vs /æ/ (sheep/ship/shape/sharp)", orderIndex: 1, targetPhonemes: ["/iː/", "/ɪ/", "/e/", "/æ/"], difficulty: 9, notes: "Tổng hợp 4 nguyên âm phía trước", subcategory: null },
  { id: "map-t3-g02-initial-confuse", topicId: "topic-3-minimal-pairs-hard", name: "Phụ âm đầu từ dễ nhầm", description: "/l/ vs /r/ vs /n/ (light/right/night)", orderIndex: 2, targetPhonemes: ["/l/", "/r/", "/n/"], difficulty: 9, notes: "Lỗi l/n và /r/", subcategory: null },
  { id: "map-t3-g03-final-drop", topicId: "topic-3-minimal-pairs-hard", name: "Phụ âm cuối từ dễ bỏ", description: "final /p/ vs /b/, /t/ vs /d/, /k/ vs /g/ (cap/cab, cat/cad)", orderIndex: 3, targetPhonemes: ["/p/", "/b/", "/t/", "/d/", "/k/", "/g/"], difficulty: 8, notes: "Người Việt hay nuốt phụ âm cuối", subcategory: null },
  { id: "map-t3-g04-dental-sibilant", topicId: "topic-3-minimal-pairs-hard", name: "Âm răng & âm xát", description: "/θ/ vs /s/ vs /t/, /ð/ vs /z/ vs /d/ (think/sink, this/diss)", orderIndex: 4, targetPhonemes: ["/θ/", "/s/", "/t/", "/ð/", "/z/", "/d/"], difficulty: 10, notes: "Khó nhất - không có âm răng trong tiếng Việt", subcategory: null },

  // --- CĐ4 TRỌNG ÂM & NỐI ÂM (4 nhóm mới) ---
  { id: "map-t4-g01-word-stress", topicId: "topic-4-stress-connected", name: "Word Stress", description: "Trọng âm từ - nghe & bấm âm tiết nhấn, đọc đúng trọng âm", orderIndex: 1, targetPhonemes: [], difficulty: 6, notes: "Mode A: Tap the Stress. Mode B: đọc từ đúng trọng âm.", subcategory: null },
  { id: "map-t4-g02-weak-forms", topicId: "topic-4-stress-connected", name: "Weak Forms", description: "Âm lướt / từ chức năng - chọn từ đọc lướt /ə/, đọc cả câu", orderIndex: 2, targetPhonemes: ["/ə/"], difficulty: 7, notes: "can/to/for/and/at → /kən/ /tə/ /fə/ /ən/ /ət/", subcategory: null },
  { id: "map-t4-g03-linking", topicId: "topic-4-stress-connected", name: "Linking", description: "Nối âm - nghe cụm & chọn phát âm đúng, đọc cụm", orderIndex: 3, targetPhonemes: [], difficulty: 7, notes: "C+V: hold on → /həʊl dɒn/. C+C: bad dog → /bæ dɒg/.", subcategory: null },
  { id: "map-t4-g04-assimilation", topicId: "topic-4-stress-connected", name: "Assimilation & Elision", description: "Biến âm & nuốt âm - nghe câu tự nhiên & chọn, đọc câu", orderIndex: 4, targetPhonemes: [], difficulty: 8, notes: "/t/+/j/=/tʃ/: meet you → meetcha. /d/+/j/=/dʒ/: did you → didja.", subcategory: null },
];

// ============================================================================
// PHONEMES (44 âm IPA - giữ nguyên v1)
// ============================================================================

export const PHONEMES: PhonemeDefinition[] = [
  // Monophthongs
  { ipa: "/iː/", type: "MONOPHTHONG", description: "Nguyên âm dài trước cao", exampleWords: ["sheep", "see", "beat"] },
  { ipa: "/ɪ/", type: "MONOPHTHONG", description: "Nguyên âm ngắn trước cao", exampleWords: ["ship", "sit", "bit"] },
  { ipa: "/e/", type: "MONOPHTHONG", description: "Nguyên âm trước trung", exampleWords: ["bed", "pen", "red"] },
  { ipa: "/æ/", type: "MONOPHTHONG", description: "Nguyên âm trước thấp", exampleWords: ["bad", "pan", "rat"] },
  { ipa: "/ɑː/", type: "MONOPHTHONG", description: "Nguyên âm sau thấp dài", exampleWords: ["father", "car", "bar"] },
  { ipa: "/ʌ/", type: "MONOPHTHONG", description: "Nguyên âm trung ngắn", exampleWords: ["fun", "cup", "but"] },
  { ipa: "/ə/", type: "MONOPHTHONG", description: "Schwa - âm yếu", exampleWords: ["about", "sofa", "the"] },
  { ipa: "/ɒ/", type: "MONOPHTHONG", description: "Nguyên âm sau tròn ngắn", exampleWords: ["hot", "dog", "got"] },
  { ipa: "/ɔː/", type: "MONOPHTHONG", description: "Nguyên âm sau tròn dài", exampleWords: ["horse", "door", "law"] },
  { ipa: "/ʊ/", type: "MONOPHTHONG", description: "Nguyên âm sau cao ngắn", exampleWords: ["full", "put", "book"] },
  { ipa: "/uː/", type: "MONOPHTHONG", description: "Nguyên âm sau cao dài", exampleWords: ["fool", "food", "blue"] },
  { ipa: "/ɜː/", type: "MONOPHTHONG", description: "Nguyên âm trung cao dài", exampleWords: ["bird", "word", "nurse"] },
  // Diphthongs
  { ipa: "/eɪ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["day", "make", "they"] },
  { ipa: "/aɪ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["die", "my", "nice"] },
  { ipa: "/ɔɪ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["boy", "coin", "voice"] },
  { ipa: "/aʊ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["now", "house", "found"] },
  { ipa: "/əʊ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["go", "home", "know"] },
  { ipa: "/eə/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["air", "care", "there"] },
  { ipa: "/ɪə/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["ear", "here", "fear"] },
  { ipa: "/ʊə/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["tour", "poor", "sure"] },
  // Consonants
  { ipa: "/p/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["pen", "cup", "happy"] },
  { ipa: "/b/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["ben", "cab", "rabbit"] },
  { ipa: "/t/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["tea", "cat", "butter"] },
  { ipa: "/d/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["day", "cad", "ladder"] },
  { ipa: "/k/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["cat", "back", "school"] },
  { ipa: "/g/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["got", "bag", "foggy"] },
  { ipa: "/f/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["fan", "leaf", "photo"] },
  { ipa: "/v/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["van", "live", "very"] },
  { ipa: "/s/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["see", "ice", "miss"] },
  { ipa: "/z/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["zoo", "easy", "buzz"] },
  { ipa: "/ʃ/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["ship", "fish", "nation"] },
  { ipa: "/ʒ/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["measure", "vision", "beige"] },
  { ipa: "/tʃ/", type: "CONSONANT", description: "Phụ âm kép vô thanh", exampleWords: ["chair", "match", "nature"] },
  { ipa: "/dʒ/", type: "CONSONANT", description: "Phụ âm kép hữu thanh", exampleWords: ["job", "age", "soldier"] },
  { ipa: "/θ/", type: "CONSONANT", description: "Phụ âm vô thanh răng", exampleWords: ["think", "path", "bath"] },
  { ipa: "/ð/", type: "CONSONANT", description: "Phụ âm hữu thanh răng", exampleWords: ["this", "bathe", "father"] },
  { ipa: "/m/", type: "CONSONANT", description: "Phụ âm mũi", exampleWords: ["man", "ham", "summer"] },
  { ipa: "/n/", type: "CONSONANT", description: "Phụ âm mũi", exampleWords: ["now", "sun", "funny"] },
  { ipa: "/ŋ/", type: "CONSONANT", description: "Phụ âm mũi", exampleWords: ["sing", "bank", "finger"] },
  { ipa: "/l/", type: "CONSONANT", description: "Phụ âm bên", exampleWords: ["light", "fall", "hello"] },
  { ipa: "/r/", type: "CONSONANT", description: "Phụ âm tiếp cận", exampleWords: ["right", "car", "carry"] },
  { ipa: "/w/", type: "CONSONANT", description: "Bán nguyên âm", exampleWords: ["we", "away", "queen"] },
  { ipa: "/j/", type: "CONSONANT", description: "Bán nguyên âm", exampleWords: ["yes", "use", "billion"] },
  { ipa: "/h/", type: "CONSONANT", description: "Âm hầu", exampleWords: ["he", "hot", "ahead"] },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTopicById(id: string): TopicDefinition | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function getSoundGroupsByTopic(topicId: string): SoundGroupDefinition[] {
  return SOUND_GROUPS.filter((sg) => sg.topicId === topicId).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getModesForTopic(topicId: string): ExerciseModeDefinition[] {
  return EXERCISE_MODES.filter((m) => m.appliesToTopics.includes(topicId)).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getPhonemeByIpa(ipa: string): PhonemeDefinition | undefined {
  return PHONEMES.find((p) => p.ipa === ipa);
}

// Tổng số bài = sum(ánh xạ nhóm → số mode áp dụng)
export const TOTAL_LESSONS = SOUND_GROUPS.reduce((sum, sg) => {
  return sum + getModesForTopic(sg.topicId).length;
}, 0);
