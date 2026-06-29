"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "./layout/AdminErrorBlock";

export type AdminBadge = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  condition: string | null;
  type: string;
  userCount?: number;
};

type FormData = { name: string; description: string; image: string; condition: string; type: string };

const emptyForm: FormData = { name: "", description: "", image: "", condition: "", type: "PERMANENT" };

export default function BadgeManagement({ badges: initialBadges }: { badges: AdminBadge[] }) {
  const [badges, setBadges] = useState(initialBadges);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      const url = editingId ? `/api/admin/badges/${editingId}` : "/api/admin/badges";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      if (editingId) {
        setBadges((prev) => prev.map((b) => (b.id === editingId ? (data.data.badge ?? { ...b, ...form }) : b)));
      } else {
        setBadges((prev) => [...prev, data.data.badge]);
      }
      setForm(emptyForm); setShowForm(false); setEditingId(null);
    } catch { setError("Không thể kết nối server"); }
  };

  const handleEdit = (badge: AdminBadge) => {
    setForm({ name: badge.name, description: badge.description || "", image: badge.image || "", condition: badge.condition || "", type: badge.type });
    setEditingId(badge.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa badge này?")) return;
    try {
      const res = await fetch(`/api/admin/badges/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setBadges((prev) => prev.filter((b) => b.id !== id));
    } catch { setError("Không thể kết nối server"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Badge / Huy hiệu</h2>
          <p className="mt-1 text-sm text-slate-600">{badges.length} huy hiệu</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>{showForm ? "Hủy" : "+ Thêm badge"}</Button>
      </div>

      {error && <AdminErrorBlock message={error} className="mb-6" />}

      {showForm && (
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">{editingId ? "Sửa badge" : "Thêm badge mới"}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-semibold">Tên</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Loại</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="PERMANENT">Vĩnh viễn</option><option value="TEMPORARY">Tạm thời</option></select></div>
              <div><label className="mb-1 block text-sm font-semibold">Hình ảnh (URL)</label><input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Điều kiện</label><input type="text" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div className="md:col-span-2"><label className="mb-1 block text-sm font-semibold">Mô tả</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-4 flex gap-2"><Button onClick={handleSubmit}>{editingId ? "Cập nhật" : "Tạo"}</Button><Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Hủy</Button></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr><th className="px-4 py-3 font-semibold">Tên</th><th className="px-4 py-3 font-semibold">Loại</th><th className="px-4 py-3 font-semibold">Điều kiện</th><th className="px-4 py-3 font-semibold">Người sở hữu</th><th className="px-4 py-3 font-semibold">Thao tác</th></tr>
            </thead>
            <tbody>
              {badges.map((badge) => (
                <tr key={badge.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold">{badge.name}</td>
                  <td className="px-4 py-3"><Badge variant={badge.type === "PERMANENT" ? "success" : "default"} size="sm">{badge.type}</Badge></td>
                  <td className="px-4 py-3">{badge.condition || "—"}</td>
                  <td className="px-4 py-3">{badge.userCount ?? 0}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => handleEdit(badge)} className="text-sm font-semibold text-blue-600 hover:underline">Sửa</button><button type="button" onClick={() => handleDelete(badge.id)} className="text-sm font-semibold text-rose-600 hover:underline">Xóa</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
