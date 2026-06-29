"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "./layout/AdminErrorBlock";
import AdminSearchInput from "./layout/AdminSearchInput";

export type AdminWordItem = {
  id: string;
  word: string;
  ipa: string;
  difficulty: string;
  status: string;
  meaningVi: string | null;
  reviewNote: string | null;
  phonemeId: string;
  phoneme?: { id: string; symbol: string };
};

type FormData = {
  word: string;
  ipa: string;
  phonemeId: string;
  meaningVi: string;
  reviewNote: string;
  difficulty: string;
  status: string;
};

const emptyForm: FormData = {
  word: "",
  ipa: "",
  phonemeId: "",
  meaningVi: "",
  reviewNote: "",
  difficulty: "EASY",
  status: "NEEDS_REVIEW",
};

export default function WordItemManagement({
  items: initialItems,
  phonemes,
}: {
  items: AdminWordItem[];
  phonemes: { id: string; symbol: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    return items.filter((i) => i.word.toLowerCase().includes(kw) || i.ipa.includes(kw));
  }, [items, search]);

  const handleSubmit = async () => {
    setError(null);
    try {
      const url = editingId ? `/api/admin/word-items/${editingId}` : "/api/admin/word-items";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
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

  const handleEdit = (item: AdminWordItem) => {
    setForm({ word: item.word, ipa: item.ipa, phonemeId: item.phonemeId, meaningVi: item.meaningVi || "", reviewNote: item.reviewNote || "", difficulty: item.difficulty, status: item.status });
    setEditingId(item.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa word item này?")) return;
    try {
      const res = await fetch(`/api/admin/word-items/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { setError("Không thể kết nối server"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Word Item</h2>
          <p className="mt-1 text-sm text-slate-600">{items.length} từ vựng</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>{showForm ? "Hủy" : "+ Thêm từ"}</Button>
      </div>

      {error && <AdminErrorBlock message={error} className="mb-6" />}

      <AdminSearchInput value={search} onChange={setSearch} placeholder="Tìm theo từ hoặc IPA..." className="mb-6" />

      {showForm && (
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">{editingId ? "Sửa" : "Thêm từ mới"}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-semibold">Word</label><input type="text" value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">IPA</label><input type="text" value={form.ipa} onChange={(e) => setForm({ ...form, ipa: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Phoneme</label><select value={form.phonemeId} onChange={(e) => setForm({ ...form, phonemeId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">-- Chọn --</option>{phonemes.map((p) => <option key={p.id} value={p.id}>{p.symbol} - {p.id.slice(0, 8)}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-semibold">Difficulty</label><select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>EASY</option><option>MEDIUM</option><option>HARD</option></select></div>
              <div><label className="mb-1 block text-sm font-semibold">Meaning (Vi)</label><input type="text" value={form.meaningVi} onChange={(e) => setForm({ ...form, meaningVi: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>DRAFT</option><option>NEEDS_REVIEW</option><option>ACTIVE</option><option>ARCHIVED</option></select></div>
              <div className="md:col-span-2"><label className="mb-1 block text-sm font-semibold">Review Note</label><input type="text" value={form.reviewNote} onChange={(e) => setForm({ ...form, reviewNote: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-4 flex gap-2"><Button onClick={handleSubmit}>{editingId ? "Cập nhật" : "Tạo"}</Button><Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Hủy</Button></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr><th className="px-4 py-3 font-semibold">Word</th><th className="px-4 py-3 font-semibold">IPA</th><th className="px-4 py-3 font-semibold">Phoneme</th><th className="px-4 py-3 font-semibold">Difficulty</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold">{item.word}</td>
                  <td className="px-4 py-3 font-mono">{item.ipa}</td>
                  <td className="px-4 py-3">{item.phoneme?.symbol || item.phonemeId.slice(0, 8)}</td>
                  <td className="px-4 py-3">{item.difficulty}</td>
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
