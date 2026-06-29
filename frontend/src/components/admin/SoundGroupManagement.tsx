"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "./layout/AdminErrorBlock";
import AdminSearchInput from "./layout/AdminSearchInput";

export type AdminSoundGroup = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  topic?: { id: string; name: string } | null;
  _count?: { exercises: number; phonemes: number };
};

type FormData = { name: string; description: string; topicId: string; status: string };

const emptyForm: FormData = { name: "", description: "", topicId: "", status: "DRAFT" };

export default function SoundGroupManagement({
  items: initialItems,
  topics,
}: {
  items: AdminSoundGroup[];
  topics: { id: string; name: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(kw));
  }, [items, search]);

  const handleSubmit = async () => {
    setError(null);
    try {
      const url = editingId ? `/api/admin/sound-groups/${editingId}` : "/api/admin/sound-groups";
      const method = editingId ? "PATCH" : "POST";
      const payload = { ...form, topicId: form.topicId || undefined };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      if (editingId) {
        setItems((prev) => prev.map((i) => (i.id === editingId ? (data.data.item ?? { ...i, ...form }) : i)));
      } else {
        setItems((prev) => [...prev, data.data.item]);
      }
      setForm(emptyForm); setShowForm(false); setEditingId(null);
    } catch { setError("Không thể kết nối server"); }
  };

  const handleEdit = (item: AdminSoundGroup) => {
    setForm({ name: item.name, description: item.description || "", topicId: item.topic?.id || "", status: item.status });
    setEditingId(item.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa sound group này?")) return;
    try {
      const res = await fetch(`/api/admin/sound-groups/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { setError("Không thể kết nối server"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Sound Group</h2>
          <p className="mt-1 text-sm text-slate-600">{items.length} nhóm âm</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>{showForm ? "Hủy" : "+ Thêm nhóm"}</Button>
      </div>

      {error && <AdminErrorBlock message={error} className="mb-6" />}

      <AdminSearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." className="mb-6" />

      {showForm && (
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">{editingId ? "Sửa" : "Thêm sound group"}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-semibold">Tên</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Chủ đề</label><select value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">-- Không --</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-semibold">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>DRAFT</option><option>NEEDS_REVIEW</option><option>ACTIVE</option><option>ARCHIVED</option></select></div>
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
              <tr><th className="px-4 py-3 font-semibold">Tên</th><th className="px-4 py-3 font-semibold">Chủ đề</th><th className="px-4 py-3 font-semibold">Bài tập</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold">{item.name}</td>
                  <td className="px-4 py-3">{item.topic?.name || "—"}</td>
                  <td className="px-4 py-3">{item._count?.exercises ?? 0}</td>
                  <td className="px-4 py-3"><Badge variant={item.status === "ACTIVE" ? "success" : "default"} size="sm">{item.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => handleEdit(item)} className="text-sm font-semibold text-blue-600 hover:underline">Sửa</button><button type="button" onClick={() => handleDelete(item.id)} className="text-sm font-semibold text-rose-600 hover:underline">Xóa</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
