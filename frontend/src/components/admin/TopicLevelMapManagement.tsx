"use client";

import { FormEvent, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "./layout/AdminErrorBlock";

export type AdminTopicItem = {
  id: string;
  name: string;
  description: string | null;
  exerciseCount: number;
  soundGroupCount: number;
};

export type AdminLevelItem = {
  id: string;
  name: string;
  description: string | null;
  exerciseCount: number;
  soundGroupCount: number;
};

export type AdminMapItem = {
  id: string;
  name: string;
  requirement: string | null;
  status: string;
  exerciseCount: number;
  progressCount: number;
};

type TopicLevelMapManagementProps = {
  topics: AdminTopicItem[];
  levels: AdminLevelItem[];
  maps: AdminMapItem[];
};

type AdminDataKind = "topics" | "levels" | "maps";

type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error?: {
        code?: string;
        message?: string;
      };
    };

const mapStatuses = ["ACTIVE", "LOCKED", "DRAFT", "ARCHIVED"];

function getMessage(payload: ApiResponse<unknown>, fallback: string) {
  return payload.success ? fallback : payload.error?.message || fallback;
}

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "ARCHIVED") return "error" as const;
  if (status === "LOCKED" || status === "DRAFT") return "warning" as const;
  return "default" as const;
}

function TextInput({
  id,
  label,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        id={id}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
      />
    </label>
  );
}

export default function TopicLevelMapManagement({ topics, levels, maps }: TopicLevelMapManagementProps) {
  const [activeKind, setActiveKind] = useState<AdminDataKind>("topics");
  const [topicItems, setTopicItems] = useState(topics);
  const [levelItems, setLevelItems] = useState(levels);
  const [mapItems, setMapItems] = useState(maps);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDetails("");
    setStatus("DRAFT");
    setMessage(null);
  };

  const startEditTopic = (item: AdminTopicItem) => {
    setActiveKind("topics");
    setEditingId(item.id);
    setName(item.name);
    setDetails(item.description ?? "");
    setMessage(null);
  };

  const startEditLevel = (item: AdminLevelItem) => {
    setActiveKind("levels");
    setEditingId(item.id);
    setName(item.name);
    setDetails(item.description ?? "");
    setMessage(null);
  };

  const startEditMap = (item: AdminMapItem) => {
    setActiveKind("maps");
    setEditingId(item.id);
    setName(item.name);
    setDetails(item.requirement ?? "");
    setStatus(item.status);
    setMessage(null);
  };

  const endpoint = activeKind === "topics" ? "/api/admin/topics" : activeKind === "levels" ? "/api/admin/levels" : "/api/admin/maps";
  const label = activeKind === "topics" ? "chủ đề" : activeKind === "levels" ? "cấp độ" : "learning map";
  const detailLabel = activeKind === "maps" ? "Yêu cầu" : "Mô tả";

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);

    const payload =
      activeKind === "maps"
        ? {
            name: name.trim(),
            requirement: details.trim() || null,
            status,
          }
        : {
            name: name.trim(),
            description: details.trim() || null,
          };

    try {
      const response = await fetch(editingId ? `${endpoint}/${editingId}` : endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (activeKind === "topics") {
        const result = (await response.json()) as ApiResponse<{ topic: AdminTopicItem }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, `Không lưu được ${label}.`) });
          return;
        }
        setTopicItems((current) =>
          editingId ? current.map((item) => (item.id === result.data.topic.id ? result.data.topic : item)) : [result.data.topic, ...current],
        );
      }

      if (activeKind === "levels") {
        const result = (await response.json()) as ApiResponse<{ level: AdminLevelItem }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, `Không lưu được ${label}.`) });
          return;
        }
        setLevelItems((current) =>
          editingId ? current.map((item) => (item.id === result.data.level.id ? result.data.level : item)) : [result.data.level, ...current],
        );
      }

      if (activeKind === "maps") {
        const result = (await response.json()) as ApiResponse<{ map: AdminMapItem }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, `Không lưu được ${label}.`) });
          return;
        }
        setMapItems((current) =>
          editingId ? current.map((item) => (item.id === result.data.map.id ? result.data.map : item)) : [result.data.map, ...current],
        );
      }

      setMessage({ type: "success", text: editingId ? `Đã cập nhật ${label}.` : `Đã tạo ${label}.` });
      setEditingId(null);
      setName("");
      setDetails("");
      setStatus("DRAFT");
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (kind: AdminDataKind, id: string, displayName: string) => {
    const confirmed = window.confirm(`Xóa hoặc lưu trữ "${displayName}"?`);
    if (!confirmed) return;

    const currentEndpoint = kind === "topics" ? "/api/admin/topics" : kind === "levels" ? "/api/admin/levels" : "/api/admin/maps";
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${currentEndpoint}/${id}`, { method: "DELETE" });

      if (kind === "topics") {
        const result = (await response.json()) as ApiResponse<{ deletedId: string }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, "Không xóa được chủ đề.") });
          return;
        }
        setTopicItems((current) => current.filter((item) => item.id !== result.data.deletedId));
      }

      if (kind === "levels") {
        const result = (await response.json()) as ApiResponse<{ deletedId: string }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, "Không xóa được cấp độ.") });
          return;
        }
        setLevelItems((current) => current.filter((item) => item.id !== result.data.deletedId));
      }

      if (kind === "maps") {
        const result = (await response.json()) as ApiResponse<{ map: AdminMapItem }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, "Không lưu trữ được learning map.") });
          return;
        }
        setMapItems((current) => current.map((item) => (item.id === result.data.map.id ? result.data.map : item)));
      }

      if (editingId === id) {
        resetForm();
      }
      setMessage({ type: "success", text: kind === "maps" ? "Đã lưu trữ learning map." : "Đã xóa mục dữ liệu." });
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Quản lý chủ đề, cấp độ và learning map</h2>
          <p className="mt-1 text-sm text-slate-600">Đây là dữ liệu nền để tạo bài tập và sắp xếp lộ trình học.</p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="Nhóm dữ liệu nền">
          {[
            { id: "topics" as const, label: "Chủ đề" },
            { id: "levels" as const, label: "Cấp độ" },
            { id: "maps" as const, label: "Learning map" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeKind === tab.id}
              onClick={() => {
                setActiveKind(tab.id);
                resetForm();
              }}
              className={`min-h-11 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${
                activeKind === tab.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={submitForm} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{editingId ? `Sửa ${label}` : `Tạo ${label}`}</h3>
              <p className="mt-1 text-sm text-slate-600">
                Topic/level chỉ xóa được khi chưa có bài tập hoặc sound group liên kết.
              </p>
            </div>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Hủy sửa
              </Button>
            )}
          </div>

          {message && <AdminErrorBlock variant={message.type === "success" ? "success" : "error"} message={message.text} className="mb-6" />}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TextInput id="admin-base-name" label="Tên" required value={name} onChange={setName} />
            {activeKind === "maps" && (
              <label className="block" htmlFor="admin-base-status">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Trạng thái</span>
                <select
                  id="admin-base-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                >
                  {mapStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <label className="block" htmlFor="admin-base-details">
            <span className="mb-1 block text-sm font-semibold text-slate-700">{detailLabel}</span>
            <textarea
              id="admin-base-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
            />
          </label>

          <Button type="submit" size="sm" loading={isSaving}>
            {editingId ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </form>

        {activeKind === "topics" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {topicItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-slate-900">{item.name}</h3>
                {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
                <p className="mt-3 text-xs text-slate-500">
                  {item.exerciseCount} bài tập - {item.soundGroupCount} sound group
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" size="sm" onClick={() => startEditTopic(item)}>
                    Sửa
                  </Button>
                  <Button type="button" variant="ghost" size="sm" loading={isSaving} onClick={() => removeItem("topics", item.id, item.name)}>
                    Xóa
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeKind === "levels" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {levelItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-bold text-slate-900">{item.name}</h3>
                {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
                <p className="mt-3 text-xs text-slate-500">
                  {item.exerciseCount} bài tập - {item.soundGroupCount} sound group
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" size="sm" onClick={() => startEditLevel(item)}>
                    Sửa
                  </Button>
                  <Button type="button" variant="ghost" size="sm" loading={isSaving} onClick={() => removeItem("levels", item.id, item.name)}>
                    Xóa
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeKind === "maps" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mapItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <Badge variant={statusVariant(item.status)} size="sm">
                    {item.status}
                  </Badge>
                </div>
                {item.requirement && <p className="mt-2 text-sm text-slate-600">{item.requirement}</p>}
                <p className="mt-3 text-xs text-slate-500">
                  {item.exerciseCount} bài tập - {item.progressCount} tiến trình
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" size="sm" onClick={() => startEditMap(item)}>
                    Sửa
                  </Button>
                  {item.status !== "ARCHIVED" && (
                    <Button type="button" variant="ghost" size="sm" loading={isSaving} onClick={() => removeItem("maps", item.id, item.name)}>
                      Lưu trữ
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
