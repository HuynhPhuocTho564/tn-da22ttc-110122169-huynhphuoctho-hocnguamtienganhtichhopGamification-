"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "../layout/AdminErrorBlock";

/**
 * XP & Level Configuration UI.
 *
 * Hiển thị và cho chỉnh sửa các thông số:
 * - XP base cho mỗi câu đúng
 * - Hệ số nhân XP khi boost
 * - Ngưỡng XP lên từng cấp độ
 *
 * UI-only: nút "Lưu" gọi /api/admin/gamification/xp-level (chưa triển khai).
 * Khi API chưa có, hiển thị thông báo lỗi thân thiện.
 */

type LevelThreshold = {
  level: number;
  xpRequired: number;
};

const DEFAULT_XP_PER_CORRECT = 10;
const DEFAULT_BOOST_MULTIPLIER = 1.5;
const DEFAULT_BOOST_ARTICLES = 3;

const DEFAULT_LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 300 },
  { level: 4, xpRequired: 700 },
  { level: 5, xpRequired: 1500 },
  { level: 6, xpRequired: 3000 },
  { level: 7, xpRequired: 6000 },
  { level: 8, xpRequired: 12000 },
];

export default function XpLevelConfig() {
  const [xpPerCorrect, setXpPerCorrect] = useState(DEFAULT_XP_PER_CORRECT.toString());
  const [boostMultiplier, setBoostMultiplier] = useState(DEFAULT_BOOST_MULTIPLIER.toString());
  const [boostArticles, setBoostArticles] = useState(DEFAULT_BOOST_ARTICLES.toString());
  const [thresholds, setThresholds] = useState<LevelThreshold[]>(DEFAULT_LEVEL_THRESHOLDS);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateThreshold = (index: number, xpRequired: number) => {
    setThresholds((prev) => prev.map((t, i) => (i === index ? { ...t, xpRequired } : t)));
  };

  const addThreshold = () => {
    const lastLevel = thresholds[thresholds.length - 1]?.level ?? 0;
    const lastXp = thresholds[thresholds.length - 1]?.xpRequired ?? 0;
    setThresholds([...thresholds, { level: lastLevel + 1, xpRequired: lastXp * 2 }]);
  };

  const removeThreshold = (index: number) => {
    setThresholds(thresholds.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gamification/xp-level", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xpPerCorrect: Number(xpPerCorrect),
          boostMultiplier: Number(boostMultiplier),
          boostArticles: Number(boostArticles),
          levelThresholds: thresholds,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setSuccess("Đã lưu cấu hình XP & Cấp độ");
    } catch {
      setError("Không thể kết nối server — API chưa được triển khai");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cấu hình XP & Cấp độ</h2>
        <p className="mt-1 text-sm text-slate-600">Thiết lập công thức XP, hệ số nhân và ngưỡng lên cấp.</p>
      </div>

      {error && <AdminErrorBlock message={error} />}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      )}

      {/* XP Settings */}
      <Card>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Công thức XP</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">XP / câu đúng</label>
              <input
                type="number"
                min={1}
                value={xpPerCorrect}
                onChange={(e) => setXpPerCorrect(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">Số XP nhận khi trả lời đúng 1 câu.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Hệ số nhân boost</label>
              <input
                type="number"
                step={0.1}
                min={1}
                value={boostMultiplier}
                onChange={(e) => setBoostMultiplier(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">VD: 1.5 = nhân XP x1.5 khi boost active.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Số bài được boost</label>
              <input
                type="number"
                min={1}
                value={boostArticles}
                onChange={(e) => setBoostArticles(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">Số bài liên tiếp được áp dụng boost.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Level Thresholds */}
      <Card>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Ngưỡng lên cấp độ</h3>
            <button
              type="button"
              onClick={addThreshold}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Thêm cấp
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Cấp độ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">XP yêu cầu</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{t.level}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={t.xpRequired}
                        onChange={(e) => updateThreshold(index, Number(e.target.value))}
                        className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeThreshold(index)}
                          className="text-sm font-semibold text-rose-600 hover:underline"
                        >
                          Xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
