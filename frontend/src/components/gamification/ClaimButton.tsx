"use client";

import { useState } from "react";

interface ClaimButtonProps {
  readonly questType: string;
  readonly targetId: string;
  readonly disabled?: boolean;
  readonly onClaimed: () => void;
}

export default function ClaimButton({
  questType,
  targetId,
  disabled,
  onClaimed,
}: ClaimButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/main-quests/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questType, targetId }),
      });
      const payload = await res.json();
      if (payload.success) {
        onClaimed();
      } else {
        setError(payload.error?.message ?? "Không thể nhận thưởng");
      }
    } catch {
      setError("Không thể nhận thưởng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={disabled || loading}
        className="rounded-lg bg-success-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-success-600 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Đang xử lý..." : "🎁 Nhận thưởng"}
      </button>
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
