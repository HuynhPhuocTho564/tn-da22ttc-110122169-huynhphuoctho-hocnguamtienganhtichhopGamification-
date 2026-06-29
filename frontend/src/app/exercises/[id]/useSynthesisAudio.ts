"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Helper speechSynthesis cho component CĐ4 Mode A (choose-weak/linking/assimilation).
 * audioUrl null trong contentJson → dùng window.speechSynthesis runtime (precedent SpeakSentenceQuestion).
 * Trả play(text) + isPlaying state. Cleanup on unmount.
 */
export function useSynthesisAudio() {
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // dừng utterance cũ
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9; // chậm hơn tự nhiên cho learner
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utter);
  }, []);

  // Cleanup: dừng speech khi unmount (tránh utterance leak)
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { play, isPlaying };
}
