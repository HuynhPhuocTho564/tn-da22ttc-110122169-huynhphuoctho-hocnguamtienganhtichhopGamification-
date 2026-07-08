/**
 * Word prompt parsing utilities for exercise questions.
 *
 * Parses question.content (JSON string) into structured WordPrompt.
 * Used by ExerciseEngineClient, ListenFeedbackSheet, SpeakWord/SentenceQuestion.
 *
 * Re-exported from ExerciseEngineClient.tsx for backward compatibility.
 *
 * @module exercises/parse-word-prompt
 */

import type { WordPrompt } from "./types";

/**
 * Normalize a text answer for comparison: lowercase, strip punctuation, collapse spaces.
 * Used for word-mode listen-choose questions (NOT phoneme mode — IPA can't be normalized).
 */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse question.content JSON into a structured WordPrompt.
 *
 * Handles two formats:
 * - JSON object with { word, ipa, audioUrl, hint, options, ... }
 * - Plain text fallback (word = content, audioUrl if starts with / or http)
 */
export function parseWordPrompt(content: string): WordPrompt {
  try {
    const parsed = JSON.parse(content) as Partial<WordPrompt>;
    return {
      word: parsed.word ? String(parsed.word) : undefined,
      ipa: parsed.ipa ? String(parsed.ipa) : undefined,
      audioUrl: parsed.audioUrl ? String(parsed.audioUrl) : undefined,
      hint: parsed.hint ? String(parsed.hint) : undefined,
      options: Array.isArray(parsed.options) ? parsed.options : undefined,
      // v2 listen_choose 3-stage (phoneme identification) — must set for correct stage rendering
      answerType: parsed.answerType,
      stage: parsed.stage,
      showIpa: typeof parsed.showIpa === "boolean" ? parsed.showIpa : true,
      targetPhoneme: parsed.targetPhoneme ? String(parsed.targetPhoneme) : undefined,
      contrastPhonemes: Array.isArray(parsed.contrastPhonemes) ? parsed.contrastPhonemes.map(String) : undefined,
      skeleton: parsed.skeleton === null ? null : parsed.skeleton ? String(parsed.skeleton) : undefined,
    };
  } catch {
    return {
      word: content,
      audioUrl: content.startsWith("/") || content.startsWith("http") ? content : undefined,
    };
  }
}
