"use client";

import { useRef, useState } from "react";

/**
 * Reusable audio playback button.
 *
 * Creates an Audio element on first play and reuses it.
 * Shows playing state with pulse animation.
 *
 * Extracted from ExerciseEngineClient (was inline, ~45 lines).
 */
export default function AudioButton({
  audioUrl,
  label = "Nghe mẫu",
  dark = false,
}: {
  audioUrl?: string;
  label?: string;
  dark?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    setIsPlaying(true);
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Audio playback failed:", error);
        setIsPlaying(false);
      });
    }
  };

  return (
    <button
      type="button"
      onClick={playAudio}
      disabled={!audioUrl}
      aria-label={label}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        dark
          ? "border-neutral-600 text-neutral-300 hover:border-white hover:text-white"
          : "border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
      } ${isPlaying ? "animate-pulse" : ""}`}
    >
      {isPlaying ? "Đang phát" : label}
    </button>
  );
}
