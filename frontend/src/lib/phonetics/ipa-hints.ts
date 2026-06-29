/**
 * IPA hints database — lời khuyên phát âm cho người Việt ESL learner.
 *
 * Dùng cho Task 5.1: khi user sai câu có target phoneme, hiện hint giải thích
 * "sai vì sao + cách sửa" (Nielsen H9 — Help users recognize & recover errors).
 *
 * Dữ liệu: âm phổ biến người Việt hay nhầm (theo tài liệu IPA + pedagogy).
 * @module phonetics/ipa-hints
 */

export type IpaHint = {
  /** Ký hiệu IPA có dấu /, vd "/ʃ/" */
  symbol: string;
  /** Cách người Việt hay nhầm với âm nào */
  vietnamese: string;
  /** Mô tả vị trí miệng/lưỡi khi phát âm đúng */
  mouthPosition: string;
  /** Lỗi thường gặp cụ thể */
  commonMistake: string;
  /** Mẹo sửa ngắn gọn, dễ làm theo */
  tip: string;
};

export const IPA_HINTS: Record<string, IpaHint> = {
  // === Consonants — friction/common confusions ===
  ʃ: {
    symbol: "/ʃ/",
    vietnamese: "Hay nhầm với /s/ (viết 'x' tiếng Việt)",
    mouthPosition: "Chu môi tròn, lưỡi cong lên phía vòm miệng cứng",
    commonMistake: "Phát âm giống 'x' tiếng Việt (không chu môi)",
    tip: "Chu môi như đang 'suỵt' ai đó (shh!), rồi đẩy hơi ra",
  },
  ʒ: {
    symbol: "/ʒ/",
    vietnamese: "Hay nhầm với /z/ hoặc 'gi' tiếng Việt",
    mouthPosition: "Giống /ʃ/ nhưng rung dây thanh (có tiếng)",
    commonMistake: "Phát âm giống 'gi' tiếng Việt (không chu môi)",
    tip: "Chu môi như /ʃ/ rồi thêm tiếng 'ừ' từ cổ họng",
  },
  θ: {
    symbol: "/θ/",
    vietnamese: "Hay nhầm với /t/ hoặc 'th' tiếng Việt",
    mouthPosition: "Đặt đầu lưỡi nhẹ giữa hai hàm răng, đẩy hơi qua",
    commonMistake: "Phát âm 'th' tiếng Việt (lưỡi không chạm răng)",
    tip: "Đặt đầu lưỡi nhẹ giữa răng trên và dưới, thổi hơi nhẹ",
  },
  ð: {
    symbol: "/ð/",
    vietnamese: "Hay nhầm với /d/ hoặc 'đ' tiếng Việt",
    mouthPosition: "Giống /θ/ nhưng rung dây thanh",
    commonMistake: "Phát âm 'đ' tiếng Việt thay vì lưỡi chạm răng",
    tip: "Đặt lưỡi giữa răng, phát âm 'd' nhưng lưỡi chạm răng",
  },
  ŋ: {
    symbol: "/ŋ/",
    vietnamese: "Hay nhầm với /n/ hoặc thêm /g/ cuối",
    mouthPosition: "Cuối lưỡi nâng chạm vòm mềm, miệng hơi mở",
    commonMistake: "Thêm /g/ ở cuối: 'sing' → 'sing-g'",
    tip: "Giống 'ng' tiếng Việt nhưng KHÔNG bật /g/ ở cuối",
  },
  tʃ: {
    symbol: "/tʃ/",
    vietnamese: "Hay nhầm với /t/ hoặc 'ch' tiếng Việt",
    mouthPosition: "Chu môi, lưỡi chạm vòm rồi bật hơi (t + ʃ)",
    commonMistake: "Phát âm 'ch' tiếng Việt (không chu môi đủ)",
    tip: "Làm như /t/ rồi chuyển ngay sang /ʃ/, chu môi rõ",
  },
  dʒ: {
    symbol: "/dʒ/",
    vietnamese: "Hay nhầm với /d/ hoặc 'tr' tiếng Việt",
    mouthPosition: "Giống /tʃ/ nhưng rung dây thanh (d + ʒ)",
    commonMistake: "Phát âm 'tr' tiếng Việt (lưỡi bật khác)",
    tip: "Làm như /d/ rồi chuyển sang /ʒ/, chu môi rõ",
  },
  r: {
    symbol: "/r/",
    vietnamese: "Hay nhầm với /r/ tiếng Việt (lưỡi bật)",
    mouthPosition: "Đầu lưỡi cuộn lên phía sau, không chạm vòm",
    commonMistake: "Lưỡi bật chạm vòm như /r/ tiếng Việt",
    tip: "Đầu lưỡi cuộn lên nhưng KHÔNG chạm, để hơi thoát ra",
  },
  l: {
    symbol: "/l/",
    vietnamese: "Hay nhầm với /l/ tiếng Việt (đầu lưỡi)",
    mouthPosition: "Đầu lưỡi chạm nướu răng trên, hơi thoát 2 bên",
    commonMistake: "Phát âm đậm như /l/ tiếng Việt",
    tip: "Đầu lưỡi chạm nhẹ nướu răng trên, đẩy hơi nhẹ hơn",
  },
  h: {
    symbol: "/h/",
    vietnamese: "Hay nhầm với 'h' tiếng Việt (khó ở cổ họng)",
    mouthPosition: "Hơi thoát ra từ cổ họng, miệng mở tự nhiên",
    commonMistake: "Phát âm 'h' tiếng Việt (khó nhẹ hơn)",
    tip: "Thở ra nhẹ như đang 'ha' hơi nóng lên kính",
  },
  w: {
    symbol: "/w/",
    vietnamese: "Hay nhầm với 'u' tiếng Việt (không chu môi)",
    mouthPosition: "Chu môi tròn chặt, hơi thoát ra",
    commonMistake: "Không chu môi đủ, nghe như 'u'",
    tip: "Chu môi tròn như đang thổi nến, rồi mở dần",
  },
  j: {
    symbol: "/j/",
    vietnamese: "Hay nhầm với 'i' hoặc 'y' tiếng Việt",
    mouthPosition: "Lưỡi nâng cao phía trước, gần vòm cứng",
    commonMistake: "Phát âm 'i' ngắn thay vì /j/ dính",
    tip: "Làm như chuẩn bị phát 'i' rồi trượt nhanh sang âm sau",
  },

  // === Vowels — common confusions ===
  æ: {
    symbol: "/æ/",
    vietnamese: "Hay nhầm với /e/ (viết 'e' tiếng Việt)",
    mouthPosition: "Miệng mở rộng, hàm dưới hạ xuống, lưỡi phẳng",
    commonMistake: "Miệng không mở đủ rộng → nghe như /e/",
    tip: "Mở miệng rộng như đang cười, hạ hàm xuống rõ",
  },
  ʌ: {
    symbol: "/ʌ/",
    vietnamese: "Hay nhầm với /a/ (viết 'ă' tiếng Việt)",
    mouthPosition: "Miệng mở vừa, lưỡi hơi lùi về sau",
    commonMistake: "Phát âm 'ă' tiếng Việt (miệng mở khác)",
    tip: "Mở miệng vừa phải, lưỡi lùi nhẹ, âm ngắn và dứt khoát",
  },
  ɜː: {
    symbol: "/ɜː/",
    vietnamese: "Hay nhầm với /ə/ hoặc 'ơ' tiếng Việt",
    mouthPosition: "Miệng trung tính, lưỡi phẳng hơi ra trước",
    commonMistake: "Phát âm 'ơ' tiếng Việt (tròn môi)",
    tip: "Môi thư giãn không tròn, lưỡi phẳng, kéo dài âm",
  },
  ə: {
    symbol: "/ə/",
    vietnamese: "Hay nhầm với âm đầy (schwa không có trong tiếng Việt)",
    mouthPosition: "Miệng hoàn toàn thư giãn, lưỡi trung tính",
    commonMistake: "Phát âm thành âm đầy (vd 'a', 'o')",
    tip: "Thư giãn hoàn toàn miệng, phát âm nhẹ ngắn như 'ừ' mệt",
  },
  iː: {
    symbol: "/iː/",
    vietnamese: "Hay nhầm với 'i' tiếng Việt (ngắn)",
    mouthPosition: "Môi kéo rộng 2 bên, lưỡi cao phía trước",
    commonMistake: "Phát âm quá ngắn như 'i' tiếng Việt",
    tip: "Kéo dài âm 'i' rõ ràng, môi căng ngang như cười",
  },
  ʊ: {
    symbol: "/ʊ/",
    vietnamese: "Hay nhầm với 'u' tiếng Việt (đậm)",
    mouthPosition: "Môi hơi tròn, lưỡi cao phía sau nhưng nhẹ",
    commonMistake: "Chu môi đậm như 'u' tiếng Việt",
    tip: "Chu môi nhẹ, âm ngắn và lười, không đậm như 'u'",
  },
  uː: {
    symbol: "/uː/",
    vietnamese: "Hay nhầm với 'u' tiếng Việt (ngắn)",
    mouthPosition: "Môi tròn chặt, lưỡi cao phía sau",
    commonMistake: "Phát âm ngắn như 'u' tiếng Việt",
    tip: "Chu môi tròn chặt, kéo dài âm 'u' rõ ràng",
  },
  ɔː: {
    symbol: "/ɔː/",
    vietnamese: "Hay nhầm với 'o' tiếng Việt",
    mouthPosition: "Môi tròn lớn, hàm hơi mở",
    commonMistake: "Phát âm 'o' tiếng Việt (miệng tròn khác)",
    tip: "Tròn môi lớn hơn 'o', kéo dài âm, hàm hơi mở",
  },
  aɪ: {
    symbol: "/aɪ/",
    vietnamese: "Hay nhầm với 'ai' tiếng Việt (dính)",
    mouthPosition: "Bắt đầu /a/ rồi trượt sang /ɪ/",
    commonMistake: "Hai âm dính liền như 'ai' tiếng Việt",
    tip: "Phát /a/ rõ rồi mới trượt sang /ɪ/, có khoảng trống",
  },
  eɪ: {
    symbol: "/eɪ/",
    vietnamese: "Hay nhầm với 'ê' tiếng Việt",
    mouthPosition: "Bắt đầu /e/ rồi trượt sang /ɪ/",
    commonMistake: "Phát 'ê' đơn âm thay vì 'eɪ' hai âm",
    tip: "Phát /e/ rồi trượt lên /ɪ/, nghe như 'ê-i'",
  },
  aʊ: {
    symbol: "/aʊ/",
    vietnamese: "Hay nhầm với 'ao' tiếng Việt",
    mouthPosition: "Bắt đầu /a/ rồi trượt sang /ʊ/",
    commonMistake: "Phát 'ao' tiếng Việt (dính, đậm)",
    tip: "Phát /a/ rõ rồi trượt sang /ʊ/ nhẹ, không đậm 'ao'",
  },
  oʊ: {
    symbol: "/oʊ/",
    vietnamese: "Hay nhầm với 'ô' tiếng Việt",
    mouthPosition: "Bắt đầu /o/ rồi trượt sang /ʊ/",
    commonMistake: "Phát 'ô' đơn âm (không có phần trượt)",
    tip: "Phát /o/ rồi trượt sang /ʊ/, nghe như 'ô-u'",
  },
};

/**
 * Trả hint cho 1 phoneme target. Pure function — dễ test.
 * @param phoneme — ký tự IPA (có hoặc không có dấu /)
 * @returns IpaHint hoặc null nếu chưa có dữ liệu
 *
 * @example getIpaHint("ʃ") → IpaHint
 * @example getIpaHint("/ʃ/") → IpaHint
 * @example getIpaHint("xyz") → null
 */
export function getIpaHint(phoneme: string): IpaHint | null {
  const cleaned = phoneme.replace(/\//g, "").trim();
  if (!cleaned) return null;
  // Thử match chính xác trước, rồi thử ký tự đầu (vd "ʃɪp" → "ʃ")
  if (IPA_HINTS[cleaned]) return IPA_HINTS[cleaned];
  const firstChar = cleaned.charAt(0);
  if (IPA_HINTS[firstChar]) return IPA_HINTS[firstChar];
  // Thử 2 ký tự đầu cho digraph (vd "tʃ")
  const firstTwo = cleaned.slice(0, 2);
  if (IPA_HINTS[firstTwo]) return IPA_HINTS[firstTwo];
  return null;
}
