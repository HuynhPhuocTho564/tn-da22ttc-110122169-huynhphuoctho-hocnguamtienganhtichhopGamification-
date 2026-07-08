"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins, Loader2, Pencil, Sparkles } from "lucide-react";
import { AdminErrorBlock, AdminPanel } from "@/components/admin/ui";

/**
 * Spin Wheel prize configuration grid.
 *
 * Owns CRUD against `/api/admin/spin-wheel`:
 * - Load active prizes on mount
 * - Edit label + prizeValue via form
 *
 * Reports the current prize count via `onPrizeCountChange` so the container
 * can render aggregate stats without owning this state.
 */

export type SpinPrizeType = "gems_10" | "gems_50" | "xp_100" | "streak_freeze" | "nothing" | "jackpot";
export type SpinPrizeStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type SpinWheelPrize = {
  id: string;
  key: string;
  label: string;
  prize: SpinPrizeType;
  prizeValue: number;
  weight: number;
  sortOrder: number;
  status: SpinPrizeStatus;
};

const PRIZE_TONE: Record<SpinPrizeType, string> = {
  gems_10: "border-blue-200 bg-blue-50 text-blue-700",
  gems_50: "border-emerald-200 bg-emerald-50 text-emerald-700",
  xp_100: "border-purple-200 bg-purple-50 text-purple-700",
  streak_freeze: "border-amber-200 bg-amber-50 text-amber-700",
  nothing: "border-slate-200 bg-slate-50 text-slate-700",
  jackpot: "border-pink-300 bg-pink-50 text-pink-700",
};

const PRIZE_LABEL: Record<SpinPrizeType, string> = {
  gems_10: "10 Gems",
  gems_50: "50 Gems",
  xp_100: "100 XP",
  streak_freeze: "Streak Freeze",
  nothing: "Nothing",
  jackpot: "Jackpot",
};

type SpinWheelPrizeConfigProps = {
  onPrizeCountChange?: (count: number) => void;
};

export default function SpinWheelPrizeConfig({ onPrizeCountChange }: SpinWheelPrizeConfigProps) {
  const [prizes, setPrizes] = useState<SpinWheelPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ label: string; prizeValue: number }>({ label: "", prizeValue: 0 });

  const loadPrizes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/spin-wheel", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Lỗi tải danh sách prize");
        return;
      }
      const active = (data.data.prizes as SpinWheelPrize[]).filter((p) => p.status !== "ARCHIVED");
      setPrizes(active);
      onPrizeCountChange?.(active.length);
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  }, [onPrizeCountChange]);

  useEffect(() => {
    void loadPrizes();
  }, [loadPrizes]);

  async function updatePrize(id: string, patch: Partial<Pick<SpinWheelPrize, "label" | "prizeValue">>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/spin-wheel/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Lỗi cập nhật prize");
        return;
      }
      setPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  }

  function handleEdit(prize: SpinWheelPrize) {
    setForm({ label: prize.label, prizeValue: prize.prizeValue });
    setEditingId(prize.id);
  }

  function handleSubmit() {
    if (!editingId) return;
    const trimmed = form.label.trim();
    if (!trimmed) { setError("Label không được để trống"); return; }
    if (form.prizeValue < 0) { setError("Giá trị phải >= 0"); return; }
    void updatePrize(editingId, { label: trimmed, prizeValue: form.prizeValue });
  }

  return (
    <>
      {error && <AdminErrorBlock message={error} className="mb-4" />}

      <AdminPanel
        title="Cấu hình các ô Prize"
        subtitle={loading ? "Đang tải cấu hình…" : `${prizes.length} ô prize đang hoạt động`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Đang tải…
          </div>
        ) : prizes.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Chưa có prize nào. Chạy <code>prisma/seed_spin_wheel_prizes.ts</code> để seed.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {prizes.map((prize) => {
              const isEditing = editingId === prize.id;
              return (
                <div key={prize.id} className={`rounded-lg border p-3 ${PRIZE_TONE[prize.prize]}`}>
                  <div className="text-xs font-bold uppercase opacity-70">{prize.key}</div>
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        autoFocus
                        className="w-full rounded border border-slate-300 px-2 py-1 text-base font-bold text-slate-900"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold">Giá trị:</label>
                        <input
                          type="number"
                          min={0}
                          value={form.prizeValue}
                          onChange={(e) => setForm({ ...form, prizeValue: Number(e.target.value) })}
                          className="w-20 rounded border border-slate-300 px-1 py-0.5 text-sm"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={handleSubmit} disabled={saving} className="rounded bg-white px-2 py-0.5 text-xs font-bold border border-slate-300 hover:bg-slate-50 disabled:opacity-50">Lưu</button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded px-2 py-0.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Hủy</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEdit(prize)}
                      className="mt-1 inline-flex items-center gap-1 text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {prize.label}
                      <Pencil aria-hidden="true" className="h-3 w-3 opacity-60" />
                    </button>
                  )}
                  {!isEditing && (
                    <p className="mt-1 text-xs opacity-60">Giá trị: {prize.prizeValue}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </>
  );
}

export { Coins, Sparkles };

/** StatTile — local mini-component for Spin Wheel summary stats. */
export function SpinWheelStatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Sparkles;
  label: string;
  value: number;
  tone: "blue" | "emerald" | "purple";
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  } as const;
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs font-bold uppercase opacity-80">{label}</div>
        <div className="mt-1 text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
