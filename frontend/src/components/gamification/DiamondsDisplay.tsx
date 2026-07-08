"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { SHOP_ITEMS, type ShopCategory } from "@/lib/gamification";
import { useRewardEvents } from "@/components/gamification/effects/RewardEventContext";

type DiamondsDisplayProps = {
  initialGems: number;
  purchasedItemIds?: string[];
};

type PurchaseResult = {
 success: boolean;
 data?: {
  item: { id: string; name: string };
  cost: number;
  user: { gems: number; streakFreezes: number; unlockedIpaReveal: boolean; unlockedSlowAudio: boolean; xpBoostRemaining: number; hintTokens: number; secondChances: number };
 };
 error?: { code: string; message: string };
};

// Task 4.2: Category tabs cho shop
const CATEGORIES: Array<{ id: ShopCategory | "all"; label: string }> = [
 { id: "all", label: "Tất cả" },
 { id: "power_up", label: "⚡ Hỗ trợ" },
 { id: "protection", label: "🛡️ Bảo vệ" },
 { id: "cosmetic", label: "✨ Trang trí" },
];

// All 10 items are implemented — read from DB ShopItem table.
const IMPLEMENTED_ITEM_IDS = new Set([
  "streak_freeze", "ipa_reveal", "slow_audio",
  "xp_boost", "hint_token", "second_chance",
  "frame_silver", "frame_gold", "frame_diamond", "frame_fire",
]);

/**
 * DiamondsDisplay - Hiển thị số đá quý và nút mở cửa hàng.
 * Đặt trên navbar, bên cạnh avatar user.
 *
 * Task 4.2: shop mở rộng 10 items + category tabs + confirm purchase (H5).
 */
export default function DiamondsDisplay({ initialGems, purchasedItemIds = [] }: DiamondsDisplayProps) {
  const [gems, setGems] = useState(initialGems);
  const [purchased, setPurchased] = useState<Set<string>>(new Set(purchasedItemIds));
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | "all">("all");
  const { emit } = useRewardEvents();

 // Listen for gems updates from other components (e.g., spin wheel)
 useEffect(() => {
   const handleGemsUpdated = (e: Event) => {
     const detail = (e as CustomEvent).detail;
     if (detail && typeof detail.gems === "number") {
       setGems(detail.gems);
     }
   };
   window.addEventListener("gems-updated", handleGemsUpdated);
   return () => window.removeEventListener("gems-updated", handleGemsUpdated);
 }, []);

 async function handlePurchase(itemId: string, itemName: string, cost: number) {
 // Task 4.2: confirm trước khi mua (Nielsen H5 — Error Prevention)
 const confirmed = window.confirm(
 `Mua "${itemName}" với ${cost} 💎?\nSố dư hiện tại: ${gems} 💎`,
 );
 if (!confirmed) return;

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
  setPurchased((prev) => new Set([...prev, itemId]));
  emit({ type: "purchase", label: `Đã mua "${body.data.item.name}" thành công!` });
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
 <>
 <button
 type="button"
 onClick={() => setIsShopOpen(true)}
 className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold text-amber-600 transition-colors hover:bg-amber-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 "
 aria-label={`Mở cửa hàng. Hiện có ${gems} đá quý`}
 >
 <span aria-hidden="true">💎</span>
 <span>{gems}</span>
 </button>

 <Modal
 isOpen={isShopOpen}
 onClose={() => {
 setIsShopOpen(false);
 }}
 title="Cửa Hàng Đá Quý"
 size="md"
 >
 <div className="space-y-4">
 <p className="text-sm text-neutral-600">
 Bạn đang có <strong className="text-amber-600">{gems} 💎</strong> đá quý.
 Nhận thêm bằng cách đạt rating TỐT/XUẤT SẮC, điểm danh, và hoàn thành quest!
 </p>

 {/* Category tabs (Task 4.2) */}
 <div className="flex flex-wrap gap-2">
 {CATEGORIES.map((category) => (
 <button
 key={category.id}
 type="button"
 onClick={() => setSelectedCategory(category.id)}
 className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
 selectedCategory === category.id
 ? "bg-primary-600 text-white"
 : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
 }`}
 >
 {category.label}
 </button>
 ))}
 </div>

 <ul className="space-y-3">
 {filteredItems.map((item) => {
 const canAfford = gems >= item.cost;
 const isImplemented = IMPLEMENTED_ITEM_IDS.has(item.id);
 const isOwned = purchased.has(item.id);
 return (
 <li
 key={item.id}
 className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4 "
 >
 <div className="flex items-start gap-3">
 <span aria-hidden="true" className="text-2xl">{item.icon}</span>
 <div>
 <p className="font-semibold text-neutral-900 ">
 {item.name}
 {!isImplemented && (
 <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
 Sắp ra mắt
 </span>
 )}
 {isOwned && (
 <span className="ml-2 rounded bg-success-100 px-1.5 py-0.5 text-[10px] font-bold text-success-700">
 Đã mua
 </span>
 )}
 </p>
 <p className="text-sm text-neutral-600 ">{item.desc}</p>
 {!isOwned && (
 <p className="mt-1 text-sm font-bold text-amber-600">{item.cost} 💎</p>
 )}
 </div>
 </div>
 <Button
 variant={isOwned ? "ghost" : "primary"}
 size="sm"
 disabled={!canAfford || !isImplemented || isOwned || purchasingId === item.id}
 loading={purchasingId === item.id}
 onClick={() => handlePurchase(item.id, item.name, item.cost)}
 >
 {!isImplemented ? "Sắp ra mắt" : isOwned ? "Đã mua" : canAfford ? "Mua" : "Không đủ"}
 </Button>
 </li>
 );
 })}
 </ul>
 </div>
 </Modal>
 </>
 );
}
