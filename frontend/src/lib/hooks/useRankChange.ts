"use client";

import { useEffect, useState } from "react";

/**
 * useRankChange — so sánh rank tuần hiện tại với rank lưu từ lần trước.
 *
 * Cơ chế (Nielsen H1 — Visibility, loss aversion):
 * - Lần đầu: lưu rank hiện tại vào localStorage, không báo
 * - Lần sau: nếu rank giảm (số lớn hơn = tụt) → trả { old, new }
 * - Nếu rank tăng hoặc giữ → không báo, cập nhật lastRank
 *
 * Dùng localStorage (bền qua session) thay vì sessionStorage như plan —
 * user quay lại hôm sau vẫn thấy thông báo tụt rank.
 *
 * @module hooks/useRankChange
 */

export type RankChange = {
  old: number;
  new: number;
};

const LAST_WEEKLY_RANK_KEY = "linguaecho_last_weekly_rank";

export function useRankChange(): RankChange | null {
  const [rankChange, setRankChange] = useState<RankChange | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkRankChange() {
      try {
        const response = await fetch("/api/leaderboard?type=tuan&limit=100");
        const body = await response.json();

        if (cancelled || !body.success || !body.data?.currentUser) return;

        const currentRank = body.data.currentUser.rank as number;
        const stored = localStorage.getItem(LAST_WEEKLY_RANK_KEY);
        const lastRank = stored ? parseInt(stored, 10) : null;

        if (lastRank !== null && !Number.isNaN(lastRank) && currentRank > lastRank) {
          setRankChange({ old: lastRank, new: currentRank });
        }

        // Luôn cập nhật lastRank cho lần sau
        localStorage.setItem(LAST_WEEKLY_RANK_KEY, String(currentRank));
      } catch {
        // Lỗi fetch leaderboard không chặn dashboard — âm thầm bỏ qua.
      }
    }

    checkRankChange();

    return () => {
      cancelled = true;
    };
  }, []);

  return rankChange;
}
