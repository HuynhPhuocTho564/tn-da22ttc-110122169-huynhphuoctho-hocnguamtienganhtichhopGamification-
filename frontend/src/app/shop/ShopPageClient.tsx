"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { TabButton } from "@/components/ui/TabButton";
import { SHOP_ITEMS, type ShopCategory } from "@/lib/gamification";
import { playSfx } from "@/lib/sfx";
import { useRewardEvents } from "@/components/gamification/effects/RewardEventContext";

/** Category-based card styles */
const CATEGORY_STYLES: Record<string, { bg: string; border: string }> = {
  power_up: { bg: "bg-blue-50", border: "border-blue-200" },
  protection: { bg: "bg-emerald-50", border: "border-emerald-200" },
  cosmetic: { bg: "bg-purple-50", border: "border-purple-200" },
};

/** Map item ID → colored SVG file name (game-icons.net CC BY 3.0) */
const SHOP_SVG_MAP: Record<string, string> = {
  ipa_reveal: "magnifier",
  slow_audio: "slow-audio",
  xp_boost: "xp-boost",
  hint_token: "hint-token",
  streak_freeze: "streak-freeze",
  second_chance: "second-chance",
  frame_silver: "frame-silver",
  frame_gold: "frame-gold",
  frame_diamond: "frame-diamond",
  frame_fire: "frame-fire",
};

/**
 * ShopPageClient — standalone shop UI (Task 6.x follow-up).
 *
 * Reuses logic from DiamondsDisplay (modal) but renders inline for better UX.
 * Server component (page.tsx) handles auth + fetches gems, passes as prop.
 */

const CATEGORIES: Array<{ id: ShopCategory | "all"; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "power_up", label: "⚡ Hỗ trợ" },
  { id: "protection", label: "🛡️ Bảo vệ" },
  { id: "cosmetic", label: "✨ Trang trí" },
];

// All items are implemented — read from DB ShopItem table.
const IMPLEMENTED_ITEMS = new Set([
  "streak_freeze", "ipa_reveal", "slow_audio",
  "xp_boost", "hint_token", "second_chance",
  "frame_silver", "frame_gold", "frame_diamond", "frame_fire",
]);

/** Items that can be purchased multiple times (consumables) */
const REPEATABLE_ITEMS = new Set([
  "streak_freeze", "xp_boost", "hint_token", "second_chance",
]);

type PurchaseResult = {
  success: boolean;
  data?: {
    item: { id: string; name: string };
    cost: number;
    user: { gems: number };
  };
  error?: { code: string; message: string };
};

type ShopPageClientProps = {
  initialGems: number;
  purchasedItemIds?: string[];
};

export default function ShopPageClient({ initialGems, purchasedItemIds = [] }: ShopPageClientProps) {
  const [gems, setGems] = useState(initialGems);
  const [purchased, setPurchased] = useState<Set<string>>(new Set(purchasedItemIds));
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | "all">("all");
  const [confirmModal, setConfirmModal] = useState<{
    itemId: string;
    itemName: string;
    cost: number;
  } | null>(null);
  const { emit } = useRewardEvents();

  function openConfirmModal(itemId: string, itemName: string, cost: number) {
    setConfirmModal({ itemId, itemName, cost });
  }

  async function confirmPurchase() {
    if (!confirmModal) return;
    const { itemId, itemName, cost } = confirmModal;

    setConfirmModal(null);
    setPurchasingId(itemId);

    try {
      const response = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const body = (await response.json()) as PurchaseResult;

      if (body.success && body.data) {
        setGems(body.data.user.gems);
        // Only add to purchased set if NOT repeatable (consumables can be bought again)
        if (!REPEATABLE_ITEMS.has(itemId)) {
          setPurchased((prev) => new Set([...prev, itemId]));
        }
        // Emit toast notification
        emit({ type: "purchase", label: `Đã mua "${body.data.item.name}" thành công!` });
        // Fire-and-forget SFX cho purchase thành công (Chunk C1)
        playSfx("correct");
      } else {
        emit({ type: "purchase", label: body.error?.message ?? "Mua hàng thất bại." });
      }
    } catch {
      emit({ type: "purchase", label: "Không thể kết nối server." });
    } finally {
      setPurchasingId(null);
    }
  }

  const filteredItems =
    selectedCategory === "all"
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-neutral-900">🛍️ Cửa hàng Đá quý</h1>
          <p className="text-lg text-neutral-600">
            Dùng đá quý để mua vật phẩm hỗ trợ luyện tập và trang trí profile.
          </p>
        </div>

        <Card className="mb-6 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Số dư hiện tại
              </p>
              <p className="mt-1 text-3xl font-black text-primary-700">
                {gems} <span aria-hidden="true">💎</span>
              </p>
            </div>
            <p className="text-sm text-neutral-600 max-w-md">
              Nhận thêm đá quý bằng cách: đạt rating TỐT/XUẤT SẮC khi làm bài,
              điểm danh hằng ngày, hoàn thành quest, và duy trì streak dài ngày.
            </p>
          </div>
        </Card>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Danh mục vật phẩm">
          {CATEGORIES.map((category) => (
            <TabButton
              key={category.id}
              active={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </TabButton>
          ))}
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const canAfford = gems >= item.cost;
            const isImplemented = IMPLEMENTED_ITEMS.has(item.id);
            const isOwned = purchased.has(item.id);
            const isRepeatable = REPEATABLE_ITEMS.has(item.id);
            const canBuy = isRepeatable ? canAfford && isImplemented : !isOwned && canAfford && isImplemented;
            const svgName = SHOP_SVG_MAP[item.id];
            const svgPath = svgName ? `/icons/shop/colored/${svgName}.svg` : null;
            const catStyle = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.power_up;
            return (
              <Card
                key={item.id}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    aria-hidden="true"
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 ${catStyle.bg} ${catStyle.border} shrink-0`}
                  >
                    {svgPath ? (
                      <img src={svgPath} alt="" width={28} height={28} />
                    ) : (
                      <span className="text-2xl">{item.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 flex items-center gap-2 flex-wrap">
                      {item.name}
                      {!isImplemented && (
                        <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                          Sắp ra mắt
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
                    <p className="mt-2 text-sm font-bold text-amber-600">
                      {item.cost} 💎
                    </p>
                  </div>
                </div>
                <Button
                  variant={isOwned && !isRepeatable ? "ghost" : "primary"}
                  size="sm"
                  disabled={!canBuy || purchasingId === item.id}
                  loading={purchasingId === item.id}
                  onClick={() => openConfirmModal(item.id, item.name, item.cost)}
                  className="shrink-0"
                >
                  {!isImplemented ? "Sắp ra mắt" : canAfford ? "Mua" : "Không đủ"}
                </Button>
              </Card>
            );
          })}
        </div>
      </main>

      <ConfirmModal
        isOpen={confirmModal !== null}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmPurchase}
        title="Xác nhận mua hàng"
        message={
          confirmModal
            ? `Mua "${confirmModal.itemName}" với ${confirmModal.cost} 💎?\nSố dư hiện tại: ${gems} 💎`
            : ""
        }
        confirmLabel="Mua"
        loading={purchasingId !== null}
      />
    </div>
  );
}
