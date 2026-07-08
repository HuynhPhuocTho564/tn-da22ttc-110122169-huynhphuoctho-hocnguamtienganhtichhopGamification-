"use client";

import { useState, useCallback } from "react";

const PRAISES = ["Chính xác!", "Giỏi lắm!", "Rất tốt!", "Đỉnh quá!", "Bạn làm được rồi!"];

export type ComboState = {
  combo: number;
  praise: string | null;
};

export function pickPraise(): string {
  return PRAISES[Math.floor(Math.random() * PRAISES.length)];
}

// Milestone level cho render 🔥: 0 (chưa), 1 (≥3), 2 (≥5), 3 (≥7).
export function comboMilestoneLevel(combo: number): 0 | 1 | 2 | 3 {
  if (combo >= 7) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1;
  return 0;
}

// Pure helpers (testable không cần React).
export function nextComboStateOnCorrect(state: ComboState): ComboState {
  const nextCombo = state.combo + 1;
  const level = comboMilestoneLevel(nextCombo);
  const prevLevel = comboMilestoneLevel(state.combo);
  // praise chỉ khi vừa đạt milestone mới (level tăng)
  const praise = level > prevLevel ? pickPraise() : null;
  return { combo: nextCombo, praise };
}

export function nextComboStateOnWrong(_state: ComboState): ComboState {
  return { combo: 0, praise: null };
}

export function useComboStreak(): {
  combo: number;
  praise: string | null;
  milestone: 0 | 1 | 2 | 3;
  onCorrect: () => void;
  onWrong: () => void;
  reset: () => void;
  clearPraise: () => void;
} {
  const [state, setState] = useState<ComboState>({ combo: 0, praise: null });

  const onCorrect = useCallback(() => {
    setState((s) => nextComboStateOnCorrect(s));
  }, []);

  const onWrong = useCallback(() => {
    setState((s) => nextComboStateOnWrong(s));
  }, []);

  const reset = useCallback(() => {
    setState({ combo: 0, praise: null });
  }, []);

  const clearPraise = useCallback(() => {
    setState((s) => ({ ...s, praise: null }));
  }, []);

  return {
    combo: state.combo,
    praise: state.praise,
    milestone: comboMilestoneLevel(state.combo),
    onCorrect,
    onWrong,
    reset,
    clearPraise,
  };
}
