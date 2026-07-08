"use client";

import { useMemo } from "react";
import { alignWords } from "@/lib/scoring";

type WordHighlightProps = {
  reference: string;
  hypothesis: string;
};

/**
 * WordHighlight — Hiển thị từ说话 đúng = xanh lá, sai/thiếu/thêm = đỏ.
 */
export default function WordHighlight({ reference, hypothesis }: WordHighlightProps) {
  const alignment = useMemo(() => alignWords(reference, hypothesis), [reference, hypothesis]);

  if (!hypothesis || hypothesis.trim() === "") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {alignment.refWords.map((w, i) => (
          <span key={`ref-${i}`} className="inline-block rounded-md border border-red-300 bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-800">
            {w.word}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {alignment.hypWords.map((w, i) => {
        const isCorrect = w.status === "correct";
        return (
          <span
            key={`hyp-${i}`}
            className={`inline-block rounded-md border px-2 py-0.5 text-sm font-semibold ${
              isCorrect
                ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                : "border-red-300 bg-red-100 text-red-800"
            }`}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}
