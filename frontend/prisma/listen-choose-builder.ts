/**
 * LISTEN-CHOOSE 3-STAGE BUILDER (SP-fix) - Helper sinh 10 câu phoneme-ID cho mode listen_choose.
 *
 * 3 stage: S1 (q1-4) hiện word+audio+N nút IPA; S2 (q5-8) ẩn word + IPA skeleton;
 * S3 (q9-10) chỉ audio+N nút. N = số contrastPhonemes (2 hoặc 3, nhóm 1-âm mồi → 2).
 *
 * Tách ra file riêng để testable (không phụ thuộc Prisma).
 */

export type ListenChooseWord = {
  word: string;
  ipa: string;
  targetPhoneme: string;
  audioUrl: string;
};

export type ListenChooseQuestion = {
  stage: 1 | 2 | 3;
  answerType: "phoneme";
  word: string;
  ipa: string;
  audioUrl: string;
  targetPhoneme: string;
  contrastPhonemes: string[];
  skeleton: string | null;
  answer: string; // = targetPhoneme
};

/**
 * Thay targetPhoneme substring trong ipa bằng "_".
 * Trả về null nếu target không nằm trong ipa (fallback: stage 2 render stage 1).
 *
 * Lưu ý: targetPhoneme thường có dấu "/" bao quanh (vd "/iː/"), nhưng trong ipa
 * thì âm nằm giữa các ký tự khác không có "/" bao quanh (vd "/ʃiːp/"). Bỏ "/" 2 đầu
 * khi so sánh để khớp.
 */
export function buildSkeleton(ipa: string, targetPhoneme: string): string | null {
  const bareTarget = targetPhoneme.replace(/\//g, "");
  if (!bareTarget || !ipa.includes(bareTarget)) return null;
  return ipa.replace(bareTarget, "_");
}

/**
 * Lọc chỉ từ chứa ĐÚNG 1 âm trong contrastPhonemes (xử lý nhóm 3-âm nhiễu).
 * Từ phải chứa targetPhoneme (âm mục tiêu nằm trong contrast) và KHÔNG chứa âm contrast khác.
 *
 * Lưu ý: contrastPhoneme thường có "/" bao quanh (vd "/iː/"), bỏ "/" khi so sánh
 * với ipa (âm trong ipa không có "/" bao quanh giữa các ký tự).
 */
export function filterSinglePhonemeWords(
  words: ListenChooseWord[],
  contrastPhonemes: string[],
): ListenChooseWord[] {
  const bareContrast = contrastPhonemes.map((ph) => ph.replace(/\//g, ""));
  return words.filter((w) => {
    const bareTarget = w.targetPhoneme.replace(/\//g, "");
    // targetPhoneme phải nằm trong contrast
    if (!bareContrast.includes(bareTarget)) return false;
    // đếm số âm contrast xuất hiện trong ipa
    let count = 0;
    for (const bare of bareContrast) {
      if (bare && w.ipa.includes(bare)) count++;
    }
    return count === 1; // chỉ đúng 1 (chính là target)
  });
}

/**
 * Xây contrastPhonemes. Nhóm N-âm (N≥2) → giữ nguyên. Nhóm 1-âm → mồi 1 từ neighbor.
 * neighborPhoneme = null khi nhóm có ≥2 âm.
 */
export function buildContrastPhonemes(
  targetPhonemes: string[],
  neighborPhoneme: string | null,
): string[] {
  if (targetPhonemes.length >= 2) return targetPhonemes;
  // nhóm 1-âm: mồi
  if (neighborPhoneme) return [targetPhonemes[0], neighborPhoneme];
  // fallback: chỉ 1 (không nên xảy ra nếu seed pass neighbor)
  return targetPhonemes;
}

/**
 * Map index 0-9 → stage (1/2/3). 4/4/2 split.
 */
export function splitStages(total: number): number[] {
  return Array.from({ length: total }, (_, i) => {
    if (i < 4) return 1;
    if (i < 8) return 2;
    return 3;
  });
}

/**
 * Cycle pool đến đủ 10 (pool <10 → lặp). pool ≥10 → slice 10.
 */
export function cycleToTen<T>(pool: T[]): T[] {
  if (pool.length >= 10) return pool.slice(0, 10);
  const result: T[] = [];
  for (let i = 0; i < 10; i++) {
    result.push(pool[i % pool.length]);
  }
  return result;
}

/**
 * Sinh 10 câu listen_choose 3-stage từ pool đã lọc + contrast.
 * pool: words đã filterSinglePhonemeWords. Trả về câu với skeleton + answer = targetPhoneme.
 */
export function buildListenChooseQuestions(
  pool: ListenChooseWord[],
  contrastPhonemes: string[],
): ListenChooseQuestion[] {
  if (pool.length === 0) return [];
  const selected = cycleToTen(pool);
  const stages = splitStages(selected.length);

  return selected.map((w, i) => {
    const stage = stages[i] as 1 | 2 | 3;
    const skeleton = stage === 2 ? buildSkeleton(w.ipa, w.targetPhoneme) : null;
    return {
      stage,
      answerType: "phoneme" as const,
      word: w.word,
      ipa: w.ipa,
      audioUrl: w.audioUrl,
      targetPhoneme: w.targetPhoneme,
      contrastPhonemes,
      skeleton,
      answer: w.targetPhoneme,
    };
  });
}
