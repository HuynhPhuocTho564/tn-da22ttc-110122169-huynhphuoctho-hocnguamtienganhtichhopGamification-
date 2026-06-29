"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "./layout/AdminErrorBlock";

export type AdminPhoneme = {
  id: string;
  symbol: string;
  name: string;
  category: string;
  description: string | null;
  mouthHint: string | null;
  commonMistake: string | null;
  status: string;
};

type PhonemeFormData = {
  symbol: string;
  name: string;
  category: string;
  description: string;
  mouthHint: string;
  commonMistake: string;
  status: string;
};

const emptyForm: PhonemeFormData = {
  symbol: "",
  name: "",
  category: "VOWEL",
  description: "",
  mouthHint: "",
  commonMistake: "",
  status: "ACTIVE",
};

export default function PhonemeManagement({ phonemes: initialPhonemes }: { phonemes: AdminPhoneme[] }) {
  const [phonemes, setPhonemes] = useState(initialPhonemes);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PhonemeFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      const url = editingId ? `/api/admin/phonemes/${editingId}` : "/api/admin/phonemes";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error?.message || "Lỗi không xác định");
        return;
      }

      if (editingId) {
        setPhonemes((prev) => prev.map((p) => (p.id === editingId ? data.data.phoneme : p)));
      } else {
        setPhonemes((prev) => [...prev, data.data.phoneme]);
      }

      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
    } catch {
      setError("Không thể kết nối server");
    }
  };

  const handleEdit = (phoneme: AdminPhoneme) => {
    setForm({
      symbol: phoneme.symbol,
      name: phoneme.name,
      category: phoneme.category,
      description: phoneme.description || "",
      mouthHint: phoneme.mouthHint || "",
      commonMistake: phoneme.commonMistake || "",
      status: phoneme.status,
    });
    setEditingId(phoneme.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa phoneme này?")) return;
    try {
      const response = await fetch(`/api/admin/phonemes/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!data.success) {
        setError(data.error?.message || "Lỗi không xác định");
        return;
      }
      setPhonemes((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Không thể kết nối server");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý Phoneme</h2>
          <p className="mt-1 text-sm text-slate-600">{phonemes.length} phoneme trong hệ thống</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}>
          {showForm ? "Hủy" : "+ Thêm phoneme"}
        </Button>
      </div>

      {error && <AdminErrorBlock message={error} className="mb-6" />}

      {showForm && (
        <Card>
          <div className="p-6">
            <h3 className="mb-4 text-lg font-bold">{editingId ? "Sửa phoneme" : "Thêm phoneme mới"}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold">Symbol (IPA)</label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="/iː/"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Tên</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Nguyên âm dài trước cao"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="VOWEL">VOWEL</option>
                  <option value="DIPHTHONG">DIPHTHONG</option>
                  <option value="CONSONANT">CONSONANT</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold">Mô tả</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Mouth Hint</label>
                <input
                  type="text"
                  value={form.mouthHint}
                  onChange={(e) => setForm({ ...form, mouthHint: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Common Mistake</label>
                <input
                  type="text"
                  value={form.commonMistake}
                  onChange={(e) => setForm({ ...form, commonMistake: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? "Cập nhật" : "Tạo"}</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Hủy</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Symbol</th>
                <th className="px-4 py-3 font-semibold">Tên</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {phonemes.map((phoneme) => (
                <tr key={phoneme.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold">{phoneme.symbol}</td>
                  <td className="px-4 py-3">{phoneme.name}</td>
                  <td className="px-4 py-3">{phoneme.category}</td>
                  <td className="px-4 py-3">
                    <Badge variant={phoneme.status === "ACTIVE" ? "success" : "default"} size="sm">
                      {phoneme.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(phoneme)}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(phoneme.id)}
                        className="text-sm font-semibold text-rose-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
