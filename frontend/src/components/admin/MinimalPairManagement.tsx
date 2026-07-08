"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AdminErrorBlock } from "@/components/admin/ui";
import AdminSearchInput from "./layout/AdminSearchInput";
import Pagination, { PAGE_SIZE } from "./layout/Pagination";

export type AdminMinimalPair = {
  id: string;
  note: string | null;
  difficulty: string;
  status: string;
  soundGroup?: { id: string; name: string };
  wordA?: { id: string; word: string; ipa: string };
  wordB?: { id: string; word: string; ipa: string };
};

type FormData = { soundGroupId: string; wordAId: string; wordBId: string; note: string; difficulty: string; status: string };

const emptyForm: FormData = { soundGroupId: "", wordAId: "", wordBId: "", note: "", difficulty: "EASY", status: "NEEDS_REVIEW" };

export default function MinimalPairManagement({
  items: initialItems,
  soundGroups,
  wordItems,
}: {
  items: AdminMinimalPair[];
  soundGroups: { id: string; name: string }[];
  wordItems: { id: string; word: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    return items.filter((i) =>
      i.wordA?.word.toLowerCase().includes(kw) || i.wordB?.word.toLowerCase().includes(kw) || (i.note?.toLowerCase().includes(kw) ?? false)
    );
  }, [items, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async () => {
    setError(null);
    try {
      const url = editingId ? `/api/admin/minimal-pairs/${editingId}` : "/api/admin/minimal-pairs";
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

  const handleEdit = (item: AdminMinimalPair) => {
    setForm({
      soundGroupId: item.soundGroup?.id || "",
      wordAId: item.wordA?.id || "",
      wordBId: item.wordB?.id || "",
      note: item.note || "",
      difficulty: item.difficulty,
      status: item.status,
    });
    setEditingId(item.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa minimal pair này?")) return;
    try {
      const res = await fetch(`/api/admin/minimal-pairs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { setError("Không thể kết nối server"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Minimal Pair</h2>
          <p className="mt-1 text-sm text-slate-600">{items.length} cặp âm (trang {page}/{totalPages || 1})</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>{showForm ? "Hủy" : "+ Thêm cặp"}</Button>
      </div>

      {error && <AdminErrorBlock message={error} className="mb-6" />}

      <AdminSearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm theo từ hoặc ghi chú..." className="mb-6" />

      {showForm && (
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">{editingId ? "Sửa" : "Thêm minimal pair"}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-semibold">Sound Group</label><select value={form.soundGroupId} onChange={(e) => setForm({ ...form, soundGroupId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">-- Chọn --</option>{soundGroups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-semibold">Word A</label><select value={form.wordAId} onChange={(e) => setForm({ ...form, wordAId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">-- Chọn --</option>{wordItems.map((w) => <option key={w.id} value={w.id}>{w.word}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-semibold">Word B</label><select value={form.wordBId} onChange={(e) => setForm({ ...form, wordBId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">-- Chọn --</option>{wordItems.map((w) => <option key={w.id} value={w.id}>{w.word}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-semibold">Difficulty</label><select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>EASY</option><option>MEDIUM</option><option>HARD</option></select></div>
              <div><label className="mb-1 block text-sm font-semibold">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>DRAFT</option><option>NEEDS_REVIEW</option><option>ACTIVE</option><option>ARCHIVED</option></select></div>
              <div className="md:col-span-2"><label className="mb-1 block text-sm font-semibold">Ghi chú</label><input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-4 flex gap-2"><Button onClick={handleSubmit}>{editingId ? "Cập nhật" : "Tạo"}</Button><Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Hủy</Button></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr><th className="px-4 py-3 font-semibold">Word A</th><th className="px-4 py-3 font-semibold">Word B</th><th className="px-4 py-3 font-semibold">Sound Group</th><th className="px-4 py-3 font-semibold">Difficulty</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Thao tác</th></tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold">{item.wordA?.word || "—"} <span className="font-mono text-xs text-slate-500">{item.wordA?.ipa}</span></td>
                  <td className="px-4 py-3 font-bold">{item.wordB?.word || "—"} <span className="font-mono text-xs text-slate-500">{item.wordB?.ipa}</span></td>
                  <td className="px-4 py-3">{item.soundGroup?.name || "—"}</td>
                  <td className="px-4 py-3">{item.difficulty}</td>
                  <td className="px-4 py-3"><Badge variant={item.status === "ACTIVE" ? "success" : "default"} size="sm">{item.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => handleEdit(item)} className="text-sm font-semibold text-blue-600 hover:underline">Sửa</button><button type="button" onClick={() => handleDelete(item.id)} className="text-sm font-semibold text-rose-600 hover:underline">Xóa</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
