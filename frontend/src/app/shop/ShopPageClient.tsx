"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TabButton } from "@/components/ui/TabButton";
import { SHOP_ITEMS, type ShopCategory } from "@/lib/gamification";
import { playSfx } from "@/lib/sfx";

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
  frame_gold: "frame-gold",
  frame_fire: "frame-fire",
  title_scholar: "title-scholar",
  title_champion: "crown",
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

// Item đã có backend effect (mua thật). Item khác chỉ "sắp ra mắt".
const IMPLEMENTED_ITEMS = new Set([
  "streak_freeze", "ipa_reveal", "slow_audio",
  "xp_boost", "hint_token", "second_chance",
  "frame_gold", "frame_fire", "title_scholar", "title_champion",
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
};

export default function ShopPageClient({ initialGems }: ShopPageClientProps) {
  const [gems, setGems] = useState(initialGems);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | "all">("all");

  async function handlePurchase(itemId: string, itemName: string, cost: number) {
    const confirmed = window.confirm(
      `Mua "${itemName}" với ${cost} 💎?\nSố dư hiện tại: ${gems} 💎`,
    );
    if (!confirmed) return;

    setPurchasingId(itemId);
    setMessage(null);

    try {
      const response = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const body = (await response.json()) as PurchaseResult;

      if (body.success && body.data) {
        setGems(body.data.user.gems);
        setMessage(`Đã mua "${body.data.item.name}" thành công!`);
        // Fire-and-forget SFX cho purchase thành công (Chunk C1)
        playSfx("correct");
      } else {
        setMessage(body.error?.message ?? "Mua hàng thất bại.");
      }
    } catch {
      setMessage("Không thể kết nối server.");
    } finally {
      setPurchasingId(null);
    }
  }

  const filteredItems =
    selectedCategory === "all"
      ? SHOP_ITEMS
      : SHOP_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
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
                  variant="primary"
                  size="sm"
                  disabled={!canAfford || !isImplemented || purchasingId === item.id}
                  loading={purchasingId === item.id}
                  onClick={() => handlePurchase(item.id, item.name, item.cost)}
                  className="shrink-0"
                >
                  {!isImplemented ? "Sắp ra mắt" : canAfford ? "Mua" : "Không đủ"}
                </Button>
              </Card>
            );
          })}
        </div>

        {message && (
          <div role="status" aria-live="polite">
            <Card className="mt-6 border-primary-200 bg-primary-50">
              <p className="text-sm text-neutral-700">{message}</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
