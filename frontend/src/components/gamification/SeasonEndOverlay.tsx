"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import RankTierBadge from "./RankTierBadge";
import { isSeasonEnding, type SeasonInfo } from "@/lib/season";
import { celebrate } from "@/lib/confetti";

/**
 * SeasonEndOverlay — overlay fullscreen khi season sắp kết thúc (Task 3.5).
 *
 * Climax moment: hiện final rank + tier + lời chúc + confetti nếu top 10.
 * Chỉ hiện 1 lần mỗi season (lưu `seen_${type}_${period}` vào localStorage).
 *
 * @module gamification/SeasonEndOverlay
 */

type SeasonRank = {
  rank: number;
  totalPlayers: number;
  score: number;
};

const SEEN_KEY_PREFIX = "linguaecho_season_seen_";

export default function SeasonEndOverlay() {
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [rankData, setRankData] = useState<SeasonRank | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const info = isSeasonEnding();
    if (!info) return;

    const seenKey = `${SEEN_KEY_PREFIX}${info.type}_${info.period}`;
    if (localStorage.getItem(seenKey) === "true") return;

    setSeason(info);

    const seasonInfo = info;
    async function loadRank() {
      try {
        const response = await fetch(`/api/leaderboard?type=${seasonInfo.type}&limit=100`);
        const body = await response.json();
        if (!body.success || !body.data?.currentUser) return;
        setRankData({
          rank: body.data.currentUser.rank,
          totalPlayers: body.data.totalPlayers ?? 0,
          score: body.data.currentUser.score,
        });

        // Confetti nếu top 10 (Goal-Gradient + Aesthetic-Usability)
        if (body.data.currentUser.rank <= 10) {
          celebrate();
        }
      } catch {
        // Lỗi fetch không chặn — overlay vẫn hiện phần chúc.
      }
    }

    loadRank();
  }, []);

  const handleDismiss = () => {
    if (season) {
      localStorage.setItem(`${SEEN_KEY_PREFIX}${season.type}_${season.period}`, "true");
    }
    setDismissed(true);
  };

  if (!season || dismissed) return null;

  const seasonLabel = season.type === "tuan" ? "tuần" : "tháng";
  const isTopTen = rankData ? rankData.rank <= 10 : false;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-end-title"
    >
      <div className="w-full max-w-md rounded-2xl border-2 border-amber-300 bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl" aria-hidden="true">
          {isTopTen ? "🏆" : "🎉"}
        </div>

        <h2 id="season-end-title" className="mb-2 text-2xl font-black text-neutral-900">
          Kết thúc {seasonLabel}!
        </h2>

        <p className="mb-6 text-sm text-neutral-600">
          Season <strong>{season.period}</strong> sắp reset. Đây là kết quả của bạn:
        </p>

        {rankData ? (
          <div className="mb-6 space-y-3">
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Vị trí cuối {seasonLabel}
              </p>
              <p className="mt-1 text-4xl font-black text-amber-800">#{rankData.rank}</p>
              {rankData.totalPlayers > 0 && (
                <div className="mt-2 flex justify-center">
                  <RankTierBadge rank={rankData.rank} totalPlayers={rankData.totalPlayers} size="md" />
                </div>
              )}
              <p className="mt-2 text-sm text-neutral-600">
                {rankData.score.toLocaleString("vi-VN")} điểm hạng
              </p>
            </div>

            {isTopTen ? (
              <p className="text-sm font-bold text-success-700">
                🎉 Bạn vào top 10 — xuất sắc! Giữ phong độ season tới!
              </p>
            ) : (
              <p className="text-sm font-bold text-neutral-700">
                Tiếp tục luyện tập để leo hạng season tới! 💪
              </p>
            )}
          </div>
        ) : (
          <p className="mb-6 text-sm text-neutral-600">
            Chưa có dữ liệu xếp hạng cho {seasonLabel} này. Hãy làm bài để tham gia season tới!
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/leaderboard" className="flex-1">
            <Button variant="primary" size="md" fullWidth>
              Xem bảng xếp hạng
            </Button>
          </Link>
          <Button variant="ghost" size="md" onClick={handleDismiss}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
