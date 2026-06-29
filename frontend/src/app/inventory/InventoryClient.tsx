"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { TabButton } from "@/components/ui/TabButton";

/**
 * InventoryClient — Kho vật phẩm của người dùng.
 * Hiển thị tất cả items + số lượng + nút Dùng (chủ động).
 *
 * Thay đổi 2026-06-26:
 *  - Tất cả 4 consumables (Bùa Đóng Băng, Sách Thần, Gợi Ý Vàng, Cơ Hội Thứ Hai)
 *    đều có nút "Dùng" — user chủ động chọn thay vì auto-consume.
 *  - POST /api/use-item hỗ trợ thêm `streak_freeze` và `xp_boost`.
 *  - howToUse đã bỏ chữ "Tự động" cho streak_freeze + xp_boost.
 */

type InventoryData = {
  streakFreezes: number;
  unlockedIpaReveal: boolean;
  unlockedSlowAudio: boolean;
  xpBoostRemaining: number;
  hintTokens: number;
  secondChances: number;
  cosmetics: Array<{ itemId: string; equipped: boolean; unlockedAt: Date }>;
};

type InventoryItem = {
  id: string;
  name: string;
  icon: string;
  quantity: number | "permanent" | "inactive";
  description: string;
  howToUse: string;
  category: "consumable" | "permanent" | "cosmetic";
  /** itemId để gọi /api/use-item (chỉ với consumable) */
  useApiId?: string;
  equipped?: boolean;
};

const COSMETIC_DISPLAY: Record<string, { name: string; icon: string }> = {
  frame_gold: { name: "Khung Avatar Vàng", icon: "🖼️" },
  frame_fire: { name: "Khung Avatar Lửa", icon: "🔥" },
  title_scholar: { name: "Danh Hiệu: Học Giả", icon: "🎓" },
  title_champion: { name: "Danh Hiệu: Quán Quân", icon: "👑" },
};

function buildInventoryItems(data: InventoryData): InventoryItem[] {
  const items: InventoryItem[] = [
    // Consumable items
    {
      id: "streak_freeze",
      name: "Bùa Đóng Băng",
      icon: "❄️",
      quantity: data.streakFreezes,
      description: "Bảo vệ chuỗi ngày khi bạn lỡ không luyện tập 1 ngày.",
      howToUse:
        "Chủ động: nhấn nút \"Dùng\" trước khi bỏ lỡ 1 ngày để kích hoạt bảo vệ streak.",
      category: "consumable",
      useApiId: "streak_freeze",
    },
    {
      id: "xp_boost",
      name: "Sách Thần (x1.5 EXP)",
      icon: "📖",
      quantity: data.xpBoostRemaining,
      description: "Nhân 1.5x EXP cho mỗi bài tập hoàn thành.",
      howToUse:
        "Chủ động: nhấn nút \"Dùng\" trước khi làm bài để áp dụng boost cho lượt đó.",
      category: "consumable",
      useApiId: "xp_boost",
    },
    {
      id: "hint_token",
      name: "Gợi Ý Vàng",
      icon: "💡",
      quantity: data.hintTokens,
      description: "Loại bỏ 1 đáp án sai trong bài nghe chọn.",
      howToUse:
        "Nhấn nút \"💡 Gợi ý\" trong bài tập Nghe & Chọn, hoặc nhấn \"Dùng\" ở đây.",
      category: "consumable",
      useApiId: "hint_token",
    },
    {
      id: "second_chance",
      name: "Cơ Hội Thứ Hai",
      icon: "🔄",
      quantity: data.secondChances,
      description: "Được làm lại 1 câu trả lời sai trong bài tập.",
      howToUse:
        "Nhấn nút \"🔄 Làm lại\" sau khi trả lời sai, hoặc nhấn \"Dùng\" ở đây.",
      category: "consumable",
      useApiId: "second_chance",
    },
    // Permanent unlocks
    {
      id: "ipa_reveal",
      name: "Kính Lúp IPA",
      icon: "🔍",
      quantity: data.unlockedIpaReveal ? "permanent" : "inactive",
      description: "Hiển thị phiên âm IPA cho câu khó trong bài Thực chiến.",
      howToUse: "Đã mở vĩnh viễn. Tự động hiển thị khi cần.",
      category: "permanent",
    },
    {
      id: "slow_audio",
      name: "Loa Ma Thuật",
      icon: "🔊",
      quantity: data.unlockedSlowAudio ? "permanent" : "inactive",
      description: "Nghe audio chậm x0.5 trong bài tập.",
      howToUse: "Đã mở vĩnh viễn. Nhấn nút \"🐢 Chậm\" trong bài tập để dùng.",
      category: "permanent",
    },
  ];

  // Cosmetic items
  for (const cosmetic of data.cosmetics) {
    const display = COSMETIC_DISPLAY[cosmetic.itemId];
    if (!display) continue;
    items.push({
      id: cosmetic.itemId,
      name: display.name,
      icon: display.icon,
      quantity: "permanent",
      description: cosmetic.equipped ? "Đang trang bị" : "Đã sở hữu — chưa trang bị",
      howToUse: "Trang bị tại trang Hồ sơ để hiển thị trên avatar.",
      category: "cosmetic",
      equipped: cosmetic.equipped,
    });
  }

  return items;
}

export default function InventoryClient({ inventory }: { inventory: InventoryData }) {
  const [filter, setFilter] = useState<"all" | "consumable" | "permanent" | "cosmetic">("all");
  const [data, setData] = useState<InventoryData>(inventory);
  const [pendingUseId, setPendingUseId] = useState<string | null>(null);
  const [useMessage, setUseMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [, startTransition] = useTransition();

  const items = buildInventoryItems(data);

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);
  const totalConsumables = items.filter(
    (i) => i.category === "consumable" && typeof i.quantity === "number" && i.quantity > 0,
  ).length;
  const totalCosmetics = items.filter((i) => i.category === "cosmetic").length;

  /**
   * Gọi /api/use-item để consume 1 vật phẩm chủ động.
   * Skill nielsen-ux-heuristics H1 (Visibility): loading + result message rõ ràng.
   */
  async function handleUse(useApiId: string, displayName: string) {
    setPendingUseId(useApiId);
    setUseMessage(null);

    try {
      const res = await fetch("/api/use-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: useApiId }),
      });
      const body = (await res.json());

      if (!body.success) {
        setUseMessage({
          type: "error",
          text: body.error?.message ?? "Không thể dùng vật phẩm",
        });
        return;
      }

      // Cập nhật local state (giảm count của đúng field)
      setData((current) => {
        const next = { ...current };
        if (useApiId === "streak_freeze") next.streakFreezes = body.data.remaining;
        else if (useApiId === "xp_boost") next.xpBoostRemaining = body.data.remaining;
        else if (useApiId === "hint_token") next.hintTokens = body.data.remaining;
        else if (useApiId === "second_chance") next.secondChances = body.data.remaining;
        return next;
      });

      setUseMessage({
        type: "success",
        text: `Đã dùng ${displayName}. Còn lại ${body.data.remaining}.`,
      });
    } catch (err) {
      setUseMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Lỗi kết nối",
      });
    } finally {
      setPendingUseId(null);
      // Tự ẩn message sau 3s
      startTransition(() => {
        setTimeout(() => setUseMessage(null), 3000);
      });
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-neutral-900">🎒 Kho Vật Phẩm</h1>
          <p className="mt-2 text-lg text-neutral-600">
            Vật phẩm bạn đã mua từ cửa hàng. Một số cần chủ động nhấn{" "}
            <span className="font-bold text-primary-700">Dùng</span> để kích hoạt.
          </p>
        </div>

        {/* Use-result toast (nielsen H1 Visibility) */}
        {useMessage && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
              useMessage.type === "success"
                ? "border-success-300 bg-success-50 text-success-800"
                : "border-error-300 bg-error-50 text-error-800"
            }`}
          >
            {useMessage.text}
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-black text-primary-700">{totalConsumables}</p>
            <p className="text-xs font-semibold text-neutral-500">Vật phẩm dùng được</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-black text-purple-700">{totalCosmetics}</p>
            <p className="text-xs font-semibold text-neutral-500">Trang trí</p>
          </Card>
          <Card className="text-center">
            <Link href="/shop" className="text-2xl font-black text-accent-600 hover:underline">
              🛍️
            </Link>
            <p className="text-xs font-semibold text-neutral-500">Mua thêm</p>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Bộ lọc vật phẩm">
          {([
            { id: "all", label: "Tất cả" },
            { id: "consumable", label: "⚡ Sử dụng" },
            { id: "permanent", label: "🔓 Đã mở" },
            { id: "cosmetic", label: "✨ Trang trí" },
          ] as const).map((tab) => (
            <TabButton
              key={tab.id}
              active={filter === tab.id}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* Items grid */}
        <div className="space-y-3">
          {filtered.map((item) => {
            const hasItem = item.quantity !== "inactive" && item.quantity !== 0;
            const quantityLabel =
              item.quantity === "permanent"
                ? "♾️ Vĩnh viễn"
                : item.quantity === "inactive"
                  ? "Chưa có"
                  : `×${item.quantity}`;

            const isConsumableUsable =
              item.category === "consumable" &&
              typeof item.quantity === "number" &&
              item.quantity > 0 &&
              item.useApiId !== undefined;

            const isPending = pendingUseId === item.useApiId;

            return (
              <Card
                key={item.id}
                className={`flex items-start gap-4 transition ${!hasItem ? "opacity-50" : ""}`}
              >
                {/* Icon */}
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl ${
                    item.category === "consumable"
                      ? "bg-blue-50 border border-blue-200"
                      : item.category === "permanent"
                        ? "bg-emerald-50 border border-emerald-200"
                        : "bg-purple-50 border border-purple-200"
                  }`}
                >
                  {item.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-neutral-900">{item.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        hasItem
                          ? "bg-success-100 text-success-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {quantityLabel}
                    </span>
                    {item.equipped && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                        Đang dùng
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                  <p className="mt-2 text-xs text-primary-700 font-semibold">
                    💡 {item.howToUse}
                  </p>
                </div>

                {/* Active "Dùng" button — chỉ hiển thị với consumable có quantity > 0 */}
                {isConsumableUsable && (
                  <button
                    type="button"
                    onClick={() => handleUse(item.useApiId!, item.name)}
                    disabled={isPending}
                    aria-label={`Dùng ${item.name}`}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Đang dùng
                      </span>
                    ) : (
                      "Dùng"
                    )}
                  </button>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <Card className="text-center p-8">
            <p className="text-neutral-500">Chưa có vật phẩm nào trong mục này.</p>
            <Link
              href="/shop"
              className="mt-3 inline-block text-primary-600 font-bold hover:underline"
            >
              Vào cửa hàng →
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
