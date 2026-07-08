"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AdminErrorBlock } from "@/components/admin/ui";
import AdminSearchInput from "./layout/AdminSearchInput";
import Pagination, { PAGE_SIZE } from "./layout/Pagination";

export type AdminQuestionBankItem = {
  id: string;
  answer: string;
  prompt: string | null;
  status: string;
  questionTypeId: string;
  soundGroupId: string | null;
  questionType?: { id: string; name: string };
  soundGroup?: { id: string; name: string } | null;
};

type FormData = { answer: string; prompt: string; questionTypeId: string; soundGroupId: string; status: string };

const emptyForm: FormData = { answer: "", prompt: "", questionTypeId: "", soundGroupId: "", status: "NEEDS_REVIEW" };

export default function QuestionBankManagement({
  items: initialItems,
  questionTypes,
  soundGroups,
}: {
  items: AdminQuestionBankItem[];
  questionTypes: { id: string; name: string }[];
  soundGroups: { id: string; name: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    return items.filter((i) => i.answer.toLowerCase().includes(kw) || (i.prompt?.toLowerCase().includes(kw) ?? false));
  }, [items, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSubmit = async () => {
    setError(null);
    try {
      const url = editingId ? `/api/admin/question-bank/${editingId}` : "/api/admin/question-bank";
      const method = editingId ? "PATCH" : "POST";
      const payload = { ...form, soundGroupId: form.soundGroupId || undefined };
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

  const handleEdit = (item: AdminQuestionBankItem) => {
    setForm({ answer: item.answer, prompt: item.prompt || "", questionTypeId: item.questionTypeId, soundGroupId: item.soundGroupId || "", status: item.status });
    setEditingId(item.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa question bank item này?")) return;
    try {
      const res = await fetch(`/api/admin/question-bank/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch { setError("Không thể kết nối server"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Question Bank</h2>
          <p className="mt-1 text-sm text-slate-600">{items.length} câu hỏi (trang {page}/{totalPages || 1})</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>{showForm ? "Hủy" : "+ Thêm câu hỏi"}</Button>
      </div>

      {error && <AdminErrorBlock message={error} className="mb-6" />}

      <AdminSearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm theo answer hoặc prompt..." className="mb-6" />

      {showForm && (
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">{editingId ? "Sửa" : "Thêm câu hỏi"}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><label className="mb-1 block text-sm font-semibold">Answer</label><input type="text" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
              <div><label className="mb-1 block text-sm font-semibold">Question Type</label><select value={form.questionTypeId} onChange={(e) => setForm({ ...form, questionTypeId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">-- Chọn --</option>{questionTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-semibold">Sound Group</label><select value={form.soundGroupId} onChange={(e) => setForm({ ...form, soundGroupId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">-- Không --</option>{soundGroups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-semibold">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>DRAFT</option><option>NEEDS_REVIEW</option><option>ACTIVE</option><option>ARCHIVED</option></select></div>
              <div className="md:col-span-2"><label className="mb-1 block text-sm font-semibold">Prompt</label><input type="text" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            </div>
            <div className="mt-4 flex gap-2"><Button onClick={handleSubmit}>{editingId ? "Cập nhật" : "Tạo"}</Button><Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Hủy</Button></div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr><th className="px-4 py-3 font-semibold">Answer</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Sound Group</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Thao tác</th></tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="max-w-[200px] truncate px-4 py-3 font-bold">{item.answer}</td>
                  <td className="px-4 py-3">{item.questionType?.name || "—"}</td>
                  <td className="px-4 py-3">{item.soundGroup?.name || "—"}</td>
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
