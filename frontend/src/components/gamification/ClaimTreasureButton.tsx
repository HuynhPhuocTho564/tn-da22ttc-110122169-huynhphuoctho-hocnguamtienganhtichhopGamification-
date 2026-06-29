"use client";

/**
 * ClaimTreasureButton — Nút "Nhận thưởng" cho Rương Kho Báu (client component).
 *
 * State machine:
 *   idle → loading → success | error
 *   success → disabled permanently (đã nhận)
 *
 * Side effect: gọi POST /api/missions/claim, sau đó router.refresh() để
 * cập nhật data server-side (diamonds count hiển thị trong header).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClaimTreasureButtonProps {
  /** Tất cả nhiệm vụ đã hoàn thành? (parent quyết định có hiện button hay không) */
  readonly unlocked: boolean;
  /** Tổng số nhiệm vụ (chỉ để hiển thị info) */
  readonly totalCount: number;
}

type ClaimState = "idle" | "loading" | "success" | "error";

interface ApiResponse {
  success: boolean;
  data?: { newGems: number; newXp: number; alreadyClaimed: boolean };
  error?: { code: string; message: string };
}

export default function ClaimTreasureButton({
  unlocked,
  totalCount,
}: ClaimTreasureButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<ClaimState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [reward, setReward] = useState<{ gems: number; xp: number } | null>(null);

  async function handleClaim() {
    if (state === "loading" || state === "success") return;
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/missions/claim", { method: "POST" });
      const body = (await res.json()) as ApiResponse;

      if (!body.success || !body.data) {
        setState("error");
        setErrorMsg(body.error?.message ?? "Có lỗi xảy ra, thử lại sau.");
        return;
      }

      if (body.data.alreadyClaimed) {
        setReward({ gems: body.data.newGems, xp: body.data.newXp });
      }
      setState("success");
      // Refresh server data (diamonds count, etc.)
      router.refresh();
    } catch {
      setState("error");
      setErrorMsg("Mất kết nối. Vui lòng thử lại.");
    }
  }

  // Chưa mở khóa → button ẩn (parent quyết định hiển thị)
  if (!unlocked) return null;

  // Đã claim thành công → success state
  if (state === "success") {
    return (
      <div className="shrink-0 text-right" aria-live="polite">
        <div className="text-sm font-bold text-success-800">✓ Đã nhận thưởng!</div>
        {reward && (
          <div className="mt-1 text-xs font-normal text-amber-800">
            +{reward.gems}💎 +{reward.xp}EXP
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        onClick={handleClaim}
        disabled={state === "loading"}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "loading"
          ? "Đang nhận..."
          : `🎁 Nhận thưởng (${totalCount} nhiệm vụ)`}
      </button>
      {state === "error" && (
        <p
          className="mt-1 max-w-[200px] text-right text-xs font-normal text-error-800"
          role="alert"
        >
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
}
