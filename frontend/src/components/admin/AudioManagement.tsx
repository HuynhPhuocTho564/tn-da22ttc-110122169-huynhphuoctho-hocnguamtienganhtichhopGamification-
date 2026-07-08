"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { AdminErrorBlock } from "@/components/admin/ui";
import AdminSearchInput from "./layout/AdminSearchInput";

export type AdminAudioFile = {
  id: string;
  path: string;
  duration: number | null;
  playLimit: number | null;
  usedIn: number;
};

type AudioFormState = {
  path: string;
  duration: string;
  playLimit: string;
};

const EMPTY_FORM: AudioFormState = { path: "", duration: "", playLimit: "" };

function fileNameFromPath(path: string) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}

function formFromAudio(audio: AdminAudioFile): AudioFormState {
  return {
    path: audio.path,
    duration: audio.duration?.toString() ?? "",
    playLimit: audio.playLimit?.toString() ?? "",
  };
}

export default function AudioManagement({ audioFiles }: { audioFiles: AdminAudioFile[] }) {
  const [audios, setAudios] = useState(audioFiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AudioFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<AdminAudioFile | null>(null);

  const filteredAudio = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return audios.filter((audio) => audio.path.toLowerCase().includes(keyword));
  }, [audios, searchTerm]);

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  };

  const openEditForm = (audio: AdminAudioFile) => {
    setForm(formFromAudio(audio));
    setEditingId(audio.id);
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.path.trim()) {
      setError("Đường dẫn file không được để trống");
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/admin/audio/${editingId}` : "/api/admin/audio";
      const method = editingId ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { path: form.path.trim() };
      if (form.duration) payload.duration = Number(form.duration);
      if (form.playLimit) payload.playLimit = Number(form.playLimit);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }

      const saved: AdminAudioFile = data.data.audio;
      if (editingId) {
        setAudios((prev) => prev.map((a) => (a.id === editingId ? saved : a)));
      } else {
        setAudios((prev) => [saved, ...prev]);
      }
      closeForm();
    } catch {
      setError("Không thể kết nối server — API chưa được triển khai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setLoadingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/audio/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      setAudios((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError("Không thể kết nối server — API chưa được triển khai");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý tệp âm thanh</h2>
          <p className="mt-1 text-sm text-slate-600">Tổng số: {audios.length} tệp</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Thêm audio
        </button>
      </div>

      {error && <AdminErrorBlock message={error} />}

      <AdminSearchInput
        id="admin-audio-search"
        aria-label="Tìm kiếm tệp âm thanh"
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Tìm kiếm theo đường dẫn file..."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAudio.map((audio) => (
          <Card key={audio.id} hover>
            <div className="p-4">
              <h3 className="mb-2 truncate text-center font-semibold text-slate-900">{fileNameFromPath(audio.path)}</h3>
              <p className="mb-4 truncate text-center text-xs text-slate-500" title={audio.path}>{audio.path}</p>

              <dl className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <dt>Thời lượng</dt>
                  <dd className="font-semibold text-slate-900">{audio.duration ? `${audio.duration}s` : "Chưa rõ"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Giới hạn phát</dt>
                  <dd className="font-semibold text-slate-900">{audio.playLimit ?? "Không giới hạn"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Sử dụng trong</dt>
                  <dd className="font-semibold text-slate-900">{audio.usedIn} bài tập</dd>
                </div>
              </dl>

              <div className="mt-4 flex justify-center gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => openEditForm(audio)}
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(audio)}
                  disabled={loadingId === audio.id}
                  className="text-sm font-semibold text-rose-600 hover:underline disabled:opacity-50"
                >
                  {loadingId === audio.id ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredAudio.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          <p>Không tìm thấy tệp âm thanh nào</p>
        </div>
      )}

      {/* Modal thêm/sửa audio */}
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={closeForm}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? "Sửa tệp âm thanh" : "Thêm tệp âm thanh"}</h3>
              <button type="button" onClick={closeForm} className="text-slate-400 hover:text-slate-600" aria-label="Đóng">×</button>
            </div>

            {error && <AdminErrorBlock message={error} className="mb-4" />}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Đường dẫn file *</label>
                <input
                  type="text"
                  value={form.path}
                  onChange={(e) => setForm({ ...form, path: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="/audio/words/ship.mp3 hoặc URL"
                />
                <p className="mt-1 text-xs text-slate-500">Đường dẫn tới file audio trên server hoặc URL công khai.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Thời lượng (giây)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="vd: 3"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Giới hạn phát</label>
                  <input
                    type="number"
                    min={0}
                    value={form.playLimit}
                    onChange={(e) => setForm({ ...form, playLimit: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Để trống = không giới hạn"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal xác nhận xóa */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Xác nhận xóa</h3>
            <p className="mb-4 text-sm text-slate-600">
              Bạn có chắc muốn xóa tệp <span className="font-semibold text-slate-900">{fileNameFromPath(deleteTarget.path)}</span>?
            </p>
            {deleteTarget.usedIn > 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                ⚠️ Tệp này đang được dùng trong {deleteTarget.usedIn} bài tập. Xóa có thể làm hỏng các bài tập đó.
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loadingId === deleteTarget.id}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {loadingId === deleteTarget.id ? "Đang xóa..." : "Xóa"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
