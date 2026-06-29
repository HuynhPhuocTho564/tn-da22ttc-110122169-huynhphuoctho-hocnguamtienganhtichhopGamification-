// Mock data cho development - sẽ thay bằng API calls

export interface Phoneme {
  symbol: string;
  name: string;
  example: string;
  type: "vowel" | "consonant";
  difficulty?: "easy" | "medium" | "hard";
}

export const IPA_DATA: Phoneme[] = [
  // Vowels
  { symbol: "iː", name: "Long i", example: "see", type: "vowel", difficulty: "easy" },
  { symbol: "ɪ", name: "Short i", example: "sit", type: "vowel", difficulty: "easy" },
  { symbol: "e", name: "Short e", example: "bed", type: "vowel", difficulty: "easy" },
  { symbol: "æ", name: "Short a", example: "cat", type: "vowel", difficulty: "medium" },
  { symbol: "ɑː", name: "Long a", example: "car", type: "vowel", difficulty: "easy" },
  { symbol: "ɒ", name: "Short o", example: "hot", type: "vowel", difficulty: "medium" },
  { symbol: "ɔː", name: "Long o", example: "door", type: "vowel", difficulty: "easy" },
  { symbol: "ʊ", name: "Short u", example: "put", type: "vowel", difficulty: "medium" },
  { symbol: "uː", name: "Long u", example: "food", type: "vowel", difficulty: "easy" },
  { symbol: "ʌ", name: "Short u", example: "cup", type: "vowel", difficulty: "medium" },
  { symbol: "ɜː", name: "Long e", example: "bird", type: "vowel", difficulty: "hard" },
  { symbol: "ə", name: "Schwa", example: "about", type: "vowel", difficulty: "hard" },
  
  // Consonants
  { symbol: "p", name: "P sound", example: "pen", type: "consonant", difficulty: "easy" },
  { symbol: "b", name: "B sound", example: "big", type: "consonant", difficulty: "easy" },
  { symbol: "t", name: "T sound", example: "tea", type: "consonant", difficulty: "easy" },
  { symbol: "d", name: "D sound", example: "dog", type: "consonant", difficulty: "easy" },
  { symbol: "k", name: "K sound", example: "cat", type: "consonant", difficulty: "easy" },
  { symbol: "g", name: "G sound", example: "go", type: "consonant", difficulty: "easy" },
  { symbol: "f", name: "F sound", example: "fish", type: "consonant", difficulty: "easy" },
  { symbol: "v", name: "V sound", example: "van", type: "consonant", difficulty: "medium" },
  { symbol: "θ", name: "Th voiceless", example: "think", type: "consonant", difficulty: "hard" },
  { symbol: "ð", name: "Th voiced", example: "this", type: "consonant", difficulty: "hard" },
  { symbol: "s", name: "S sound", example: "sun", type: "consonant", difficulty: "easy" },
  { symbol: "z", name: "Z sound", example: "zoo", type: "consonant", difficulty: "medium" },
  { symbol: "ʃ", name: "Sh sound", example: "ship", type: "consonant", difficulty: "medium" },
  { symbol: "ʒ", name: "Zh sound", example: "vision", type: "consonant", difficulty: "hard" },
  { symbol: "h", name: "H sound", example: "hat", type: "consonant", difficulty: "easy" },
  { symbol: "m", name: "M sound", example: "man", type: "consonant", difficulty: "easy" },
  { symbol: "n", name: "N sound", example: "no", type: "consonant", difficulty: "easy" },
  { symbol: "ŋ", name: "Ng sound", example: "sing", type: "consonant", difficulty: "medium" },
  { symbol: "l", name: "L sound", example: "leg", type: "consonant", difficulty: "medium" },
  { symbol: "r", name: "R sound", example: "red", type: "consonant", difficulty: "hard" },
  { symbol: "w", name: "W sound", example: "wet", type: "consonant", difficulty: "easy" },
  { symbol: "j", name: "Y sound", example: "yes", type: "consonant", difficulty: "easy" },
];
