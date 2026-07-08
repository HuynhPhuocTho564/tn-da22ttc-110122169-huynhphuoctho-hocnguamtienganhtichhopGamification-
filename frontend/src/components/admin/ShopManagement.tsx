"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminErrorBlock, AdminPanel } from "@/components/admin/ui";
import AdminSearchInput from "./layout/AdminSearchInput";

/**
 * Shop Items management UI.
 *
 * PLAN/ADMIN_DASHBOARD_new.md §2 — Quản lý 9 shop items thuộc 3 nhóm:
 * - Power-ups (XP Boost, Hint Token, Second Chance, IPA Reveal)
 * - Protection (Streak Freeze)
 * - Cosmetics (Khung avatar, Danh hiệu)
 *
 * Persisted to `ShopItem` table via /api/admin/shop (GET/POST/PATCH/DELETE).
 * Soft delete: DELETE sets status=ARCHIVED so existing user references stay valid.
 */

export type ShopItemCategory = "power_up" | "protection" | "cosmetic";
export type ShopItemStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type ShopItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  cost: number;
  category: ShopItemCategory;
  sortOrder: number;
  status: ShopItemStatus;
};

const CATEGORY_LABEL: Record<ShopItemCategory, string> = {
  power_up: "Power-up",
  protection: "Protection",
  cosmetic: "Cosmetic",
};

const CATEGORY_TONE: Record<ShopItemCategory, string> = {
  power_up: "border-blue-200 bg-blue-50 text-blue-700",
  protection: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cosmetic: "border-purple-200 bg-purple-50 text-purple-700",
};

const STATUS_TONE: Record<ShopItemStatus, string> = {
  ACTIVE: "border-emerald-300 bg-emerald-50 text-emerald-700",
  DRAFT: "border-amber-300 bg-amber-50 text-amber-700",
  ARCHIVED: "border-slate-300 bg-slate-50 text-slate-600",
};

type FormData = {
  key: string;
  name: string;
  description: string;
  cost: number;
  category: ShopItemCategory;
  sortOrder: number;
  status: ShopItemStatus;
};

const emptyForm: FormData = { key: "", name: "", description: "", cost: 10, category: "power_up", sortOrder: 0, status: "DRAFT" };

export default function ShopManagement({ items: initialItems }: { items: ShopItem[] }) {
  const [items, setItems] = useState<ShopItem[]>(initialItems.filter((item) => item.status !== "ARCHIVED"));
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.key.toLowerCase().includes(keyword);
      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/shop/${editingId}` : "/api/admin/shop";
      const method = editingId ? "PATCH" : "POST";
      const payload = editingId
        ? { name: form.name.trim(), description: form.description.trim(), cost: form.cost, category: form.category, sortOrder: form.sortOrder, status: form.status }
        : { key: form.key.trim() || `item_${Date.now().toString(36)}`, name: form.name.trim(), description: form.description.trim(), cost: form.cost, category: form.category, sortOrder: form.sortOrder };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message ?? "Lỗi"); return; }
      if (editingId) {
        setItems((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...form } : item)));
      } else {
        setItems((prev) => [...prev, data.data.item as ShopItem]);
      }
      setForm(emptyForm); setShowForm(false); setEditingId(null);
    } catch { setError("Không thể kết nối server"); } finally { setSaving(false); }
  }

  function handleEdit(item: ShopItem) {
    setForm({ key: item.key, name: item.name, description: item.description, cost: item.cost, category: item.category, sortOrder: item.sortOrder, status: item.status });
    setEditingId(item.id); setShowForm(true);
  }

  async function archiveItem(id: string) {
    if (!confirm("Lưu trữ item này?")) return;
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/shop/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message ?? "Lỗi"); return; }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch { setError("Không thể kết nối server"); } finally { setSaving(false); }
  }

  const stats = {
    total: items.length,
    powerUps: items.filter((item) => item.category === "power_up").length,
    protection: items.filter((item) => item.category === "protection").length,
    cosmetics: items.filter((item) => item.category === "cosmetic").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Tổng items" value={stats.total} tone="blue" />
        <StatTile label="Power-up" value={stats.powerUps} tone="emerald" />
        <StatTile label="Protection" value={stats.protection} tone="amber" />
        <StatTile label="Cosmetic" value={stats.cosmetics} tone="purple" />
      </div>

      <AdminPanel
        title="Danh sách Shop Items"
        subtitle="9 items across 3 nhóm (Power-up / Protection / Cosmetic)."
        action={
          <button
            type="button"
            onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            {showForm ? "Hủy" : "Thêm item"}
          </button>
        }
      >
        {error && <AdminErrorBlock message={error} className="mb-4" />}

        {showForm && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 font-bold text-slate-900">{editingId ? "Sửa item" : "Thêm item mới"}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {!editingId && (
                <div><label className="mb-1 block text-sm font-semibold">Key</label><input type="text" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="Tự动生成 nếu để trống" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              )}
              <div><label className="mb-1 block text-sm font-semibold">Tên</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Giá (Gems)</label><input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Nhóm</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ShopItemCategory })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="power_up">Power-up</option><option value="protection">Protection</option><option value="cosmetic">Cosmetic</option></select></div>
              <div><label className="mb-1 block text-sm font-semibold">Thứ tự</label><input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              {editingId && (
                <div><label className="mb-1 block text-sm font-semibold">Trạng thái</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ShopItemStatus })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="ACTIVE">ACTIVE</option><option value="DRAFT">DRAFT</option></select></div>
              )}
              <div className="md:col-span-2"><label className="mb-1 block text-sm font-semibold">Mô tả</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleSubmit} disabled={saving || !form.name.trim()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{editingId ? "Cập nhật" : "Tạo"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-md px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Hủy</button>
            </div>
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <AdminSearchInput
            id="admin-shop-search"
            aria-label="Tìm kiếm shop items"
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Tìm theo tên, key, mô tả..."
            className="flex-1"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Tất cả nhóm</option>
            <option value="power_up">Power-up</option>
            <option value="protection">Protection</option>
            <option value="cosmetic">Cosmetic</option>
          </select>
        </div>
        <p className="mb-4 text-xs text-slate-500">Hiển thị {filteredItems.length} / {items.length} items</p>

        {filteredItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Không tìm thấy shop item nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-bold">Key</th>
                  <th className="px-2 py-2 font-bold">Nhóm</th>
                  <th className="px-2 py-2 font-bold">Item</th>
                  <th className="px-2 py-2 font-bold">Mô tả</th>
                  <th className="px-2 py-2 font-bold">Giá</th>
                  <th className="px-2 py-2 font-bold">Trạng thái</th>
                  <th className="px-2 py-2 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-2 py-3 font-mono text-xs text-slate-500">{item.key}</td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${CATEGORY_TONE[item.category]}`}>
                        {CATEGORY_LABEL[item.category]}
                      </span>
                    </td>
                    <td className="px-2 py-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-2 py-3 text-slate-600 max-w-[200px] truncate">{item.description}</td>
                    <td className="px-2 py-3 font-bold">{item.cost} Gems</td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${STATUS_TONE[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => handleEdit(item)} className="rounded-md px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50">Sửa</button>
                        <button type="button" onClick={() => archiveItem(item.id)} disabled={saving} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: "blue" | "emerald" | "amber" | "purple" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  } as const;
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-xs font-bold uppercase opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
