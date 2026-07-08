/**
 * Script cập nhật IPA cho các câu trong lesson-content.ts
 * Sử dụng Free Dictionary API: https://api.dictionaryapi.dev
 *
 * Usage: npx tsx prisma/update_sentence_ipa.ts
 */

import * as fs from "fs";
import * as path from "path";

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const FILE_PATH = path.join(__dirname, "lesson-content.ts");

// Cache để tránh gọi API trùng lặp
const ipaCache = new Map<string, string>();

/**
 * Lấy IPA cho 1 từ từ Free Dictionary API
 */
async function fetchIPA(word: string): Promise<string | null> {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleanWord) return null;

  // Kiểm tra cache
  if (ipaCache.has(cleanWord)) {
    return ipaCache.get(cleanWord)!;
  }

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(cleanWord)}`);
    if (!res.ok) {
      console.warn(`  ⚠️ Không tìm thấy IPA cho "${cleanWord}"`);
      return null;
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // Lấy IPA từ phonetics (ưu tiên có audio US)
      const entry = data[0];
      let ipa = entry.phonetic;

      // Tìm phonetic có audio US nếu có
      if (entry.phonetics && Array.isArray(entry.phonetics)) {
        const usPhonetic = entry.phonetics.find(
          (p: { text?: string; audio?: string }) =>
            p.audio?.includes("-us") || p.audio?.includes("en-US")
        );
        if (usPhonetic?.text) {
          ipa = usPhonetic.text;
        }
      }

      if (ipa) {
        ipaCache.set(cleanWord, ipa);
        return ipa;
      }
    }
  } catch (err) {
    console.error(`  ❌ Lỗi khi gọi API cho "${cleanWord}":`, err);
  }

  return null;
}

/**
 * Tạo IPA cho câu từ các từ riêng lẻ
 */
async function generateSentenceIPA(sentence: string): Promise<string> {
  const words = sentence.split(/\s+/);
  const ipaWords: string[] = [];

  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "");

    if (!cleanWord) {
      ipaWords.push(word);
      continue;
    }

    const ipa = await fetchIPA(cleanWord);
    if (ipa) {
      const cleanIPA = ipa.replace(/^\/|\/$/g, "");
      ipaWords.push(cleanIPA);
    } else {
      ipaWords.push(`[${cleanWord}]`);
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  return `/${ipaWords.join(" ")}/`;
}

interface SentenceToUpdate {
  lineIndex: number;
  sentence: string;
  currentIPA: string;
}

/**
 * Parse file để tìm các câu có IPA
 */
function parseSentences(content: string): SentenceToUpdate[] {
  const lines = content.split("\n");
  const results: SentenceToUpdate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Tìm dòng có sentence: "..."
    const sentenceMatch = line.match(/sentence:\s*"([^"]+)"/);
    if (!sentenceMatch) continue;

    const sentence = sentenceMatch[1];

    // Tìm dòng ipa: "..." trong vòng 10 dòng tiếp theo
    for (let j = i; j < Math.min(i + 15, lines.length); j++) {
      const ipaLine = lines[j];
      const ipaMatch = ipaLine.match(/ipa:\s*"([^"]+)"/);
      if (ipaMatch) {
        results.push({
          lineIndex: j,
          sentence,
          currentIPA: ipaMatch[1],
        });
        break;
      }
    }
  }

  return results;
}

async function main() {
  console.log("🔧 Script cập nhật IPA cho câu trong lesson-content.ts");
  console.log("📡 Sử dụng Free Dictionary API\n");

  const content = fs.readFileSync(FILE_PATH, "utf-8");
  const sentences = parseSentences(content);
  console.log(`📋 Tìm thấy ${sentences.length} câu có IPA\n`);

  const lines = content.split("\n");
  let updateCount = 0;

  for (const { lineIndex, sentence, currentIPA } of sentences) {
    console.log(`\n📖 Câu: "${sentence}"`);
    console.log(`   IPA hiện tại: ${currentIPA}`);

    const newIPA = await generateSentenceIPA(sentence);
    console.log(`   IPA mới:      ${newIPA}`);

    const normalizedCurrent = currentIPA.replace(/\s+/g, " ").trim();
    const normalizedNew = newIPA.replace(/\s+/g, " ").trim();

    if (normalizedCurrent !== normalizedNew) {
      console.log(`   ✅ Cần cập nhật!`);
      // Thay thế dòng ipa trong lines
      lines[lineIndex] = lines[lineIndex].replace(
        /ipa:\s*"[^"]*"/,
        `ipa: "${newIPA}"`
      );
      updateCount++;
    } else {
      console.log(`   ⏭️ IPA đã đúng, bỏ qua`);
    }
  }

  if (updateCount > 0) {
    const backupPath = FILE_PATH + ".bak";
    fs.writeFileSync(backupPath, content, "utf-8");
    console.log(`\n💾 Đã backup file cũ: ${backupPath}`);

    fs.writeFileSync(FILE_PATH, lines.join("\n"), "utf-8");
    console.log(`✅ Đã cập nhật ${updateCount} câu IPA`);
  } else {
    console.log(`\n✅ Tất cả IPA đã đúng, không cần cập nhật`);
  }

  console.log("\n📊 Tổng kết:");
  console.log(`   - Tổng câu có IPA: ${sentences.length}`);
  console.log(`   - Đã cập nhật: ${updateCount}`);
}

main().catch(console.error);
