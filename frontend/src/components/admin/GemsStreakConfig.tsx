"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "../layout/AdminErrorBlock";

/**
 * Gems & Streak Configuration UI.
 *
 * Hiển thị và cho chỉnh sửa:
 * - Phần thưởng Gems theo ngày check-in (chu kỳ 7 ngày)
 * - Giá items trong shop (Streak Freeze, XP Boost, Hint Token...)
 * - Ngưỡng streak để hiển thị hiệu ứng lửa
 */

type DailyReward = {
  day: number;
  gems: number;
  bonus?: string;
};

type ShopItem = {
  id: string;
  name: string;
  cost: number;
  description: string;
};

const DEFAULT_DAILY_REWARDS: DailyReward[] = [
  { day: 1, gems: 5 },
  { day: 2, gems: 8 },
  { day: 3, gems: 10 },
  { day: 4, gems: 12 },
  { day: 5, gems: 15 },
  { day: 6, gems: 20 },
  { day: 7, gems: 25, bonus: "🏆 Huy hiệu" },
];

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: "streak_freeze", name: "Bùa đóng băng Streak", cost: 30, description: "Bảo vệ streak 1 ngày khi bỏ lỡ" },
  { id: "xp_boost", name: "Sách Thần (XP Boost)", cost: 50, description: "x1.5 XP cho 3 bài tiếp theo" },
  { id: "hint_token", name: "Gợi Ý Vàng", cost: 20, description: "Hiện gợi ý cho 1 câu khó" },
  { id: "second_chance", name: "Cơ Hội Thứ Hai", cost: 40, description: "Làm lại 1 bài không mất lượt" },
];

const DEFAULT_STREAK_FIRE_THRESHOLDS = [3, 7, 14, 30];

export default function GemsStreakConfig() {
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>(DEFAULT_DAILY_REWARDS);
  const [shopItems, setShopItems] = useState<ShopItem[]>(DEFAULT_SHOP_ITEMS);
  const [fireThresholds, setFireThresholds] = useState(DEFAULT_STREAK_FIRE_THRESHOLDS.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateReward = (index: number, gems: number) => {
    setDailyRewards((prev) => prev.map((r, i) => (i === index ? { ...r, gems } : r)));
  };

  const updateShopCost = (index: number, cost: number) => {
    setShopItems((prev) => prev.map((s, i) => (i === index ? { ...s, cost } : s)));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gamification/gems-streak", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRewards,
          shopItems,
          streakFireThresholds: fireThresholds.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setSuccess("Đã lưu cấu hình Gems & Streak");
    } catch {
      setError("Không thể kết nối server — API chưa được triển khai");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cấu hình Gems & Streak</h2>
        <p className="mt-1 text-sm text-slate-600">Phần thưởng check-in, shop items và ngưỡng hiệu ứng streak.</p>
      </div>

      {error && <AdminErrorBlock message={error} />}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      )}

      {/* Daily Check-in Rewards */}
      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Phần thưởng check-in hàng ngày</h3>
          <p className="mb-4 text-sm text-slate-600">Chu kỳ 7 ngày. Ngày 7 có thể thêm bonus huy hiệu.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dailyRewards.map((reward, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 text-sm font-bold text-slate-900">Ngày {reward.day}</div>
                <label className="mb-1 block text-xs text-slate-500">Gems</label>
                <input
                  type="number"
                  min={0}
                  value={reward.gems}
                  onChange={(e) => updateReward(index, Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
                {reward.bonus && (
                  <div className="mt-2 text-xs font-semibold text-amber-600">{reward.bonus}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Shop Items */}
      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Cấu hình Shop</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Mô tả</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Giá (Gems)</th>
                </tr>
              </thead>
              <tbody>
                {shopItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.description}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={item.cost}
                        onChange={(e) => updateShopCost(index, Number(e.target.value))}
                        className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Streak Fire Thresholds */}
      <Card>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-bold text-slate-900">Ngưỡng hiệu ứng lửa Streak</h3>
          <p className="mb-4 text-sm text-slate-600">Mỗi mốc streak sẽ mở khóa hiệu ứng lửa lớn hơn để tạo động lực.</p>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Các mốc (phân tách bằng dấu phẩy)</label>
          <input
            type="text"
            value={fireThresholds}
            onChange={(e) => setFireThresholds(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="3, 7, 14, 30"
          />
          <p className="mt-1 text-xs text-slate-500">VD: 3 ngày = lửa nhỏ, 7 ngày = lửa vừa, 14 ngày = lửa lớn, 30 ngày = lửa rồng.</p>
        </div>
      </Card>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}
