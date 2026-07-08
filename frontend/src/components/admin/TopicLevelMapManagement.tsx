"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AdminErrorBlock } from "@/components/admin/ui";
import AdminSearchInput from "./layout/AdminSearchInput";
import Pagination, { PAGE_SIZE } from "./layout/Pagination";

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
  requiredMapId: string | null;
  requiredMapName: string | null;
  unlockThresholdPercent: number;
  subcategory: string | null;
  topicId: string;
};

export type AdminExerciseItem = {
  id: string;
  name: string;
  description: string | null;
  topicId: string;
  topic: string;
  levelId: string;
  level: string;
  mapId: string;
  map: string;
  questionCount: number;
  attemptCount: number;
  status: string;
};

type QuestionItem = {
  id: string;
  exerciseId: string;
  name: string | null;
  content: string;
  status: string;
  score: number;
  answer: string;
  type: { id: string; name: string };
  optionCount: number;
};

type TopicLevelMapManagementProps = {
  topics: AdminTopicItem[];
  maps: AdminMapItem[];
  exercises: AdminExerciseItem[];
  levels: AdminLevelItem[];
  questionTypes: { id: string; name: string }[];
  topicId?: string | null;
  topicName?: string | null;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error?: { code?: string; message?: string } };

const exerciseStatuses = ["ACTIVE", "DRAFT", "ARCHIVED"];
const mapStatuses = ["ACTIVE", "LOCKED", "DRAFT", "ARCHIVED"];
const UNCATEGORIZED = "Chưa phân loại";

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

export default function TopicLevelMapManagement({
  topics,
  maps,
  exercises,
  levels,
  questionTypes,
  topicId,
  topicName,
}: TopicLevelMapManagementProps) {
  const scopedMaps = useMemo(() => topicId ? maps.filter((m) => m.topicId === topicId) : maps, [topicId, maps]);
  const scopedExercises = useMemo(() => topicId ? exercises.filter((e) => e.topicId === topicId) : exercises, [topicId, exercises]);

  const [activeTab, setActiveTab] = useState<"topics" | "maps">(topicId ? "maps" : "topics");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [topicItems, setTopicItems] = useState<AdminTopicItem[]>(topics);
  const [mapItems, setMapItems] = useState<AdminMapItem[]>(scopedMaps);
  const [exerciseItems, setExerciseItems] = useState<AdminExerciseItem[]>(scopedExercises);

  // Sync local state when scoped props change (e.g. topicId changes via tab switch)
  useEffect(() => { setMapItems(scopedMaps); }, [scopedMaps]);
  useEffect(() => { setExerciseItems(scopedExercises); }, [scopedExercises]);

  const [topicForm, setTopicForm] = useState<{ editingId: string | null; name: string; description: string }>({
    editingId: null,
    name: "",
    description: "",
  });
  const [mapForm, setMapForm] = useState<{
    editingId: string | null;
    name: string;
    requirement: string;
    status: string;
    subcategory: string;
  }>({
    editingId: null,
    name: "",
    requirement: "",
    status: "DRAFT",
    subcategory: "",
  });
  const [exerciseForm, setExerciseForm] = useState<{
    editingId: string | null;
    name: string;
    description: string;
    status: string;
  }>({
    editingId: null,
    name: "",
    description: "",
    status: "DRAFT",
  });

  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);
  const [showExerciseFormForMap, setShowExerciseFormForMap] = useState<string | null>(null);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [exerciseQuestions, setExerciseQuestions] = useState<Record<string, QuestionItem[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<string | null>(null);
  const [showQuestionFormForExercise, setShowQuestionFormForExercise] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<{
    word: string; ipa: string; audioUrl: string; hint: string;
    sentence: string;
    wordA: string; ipaA: string; wordB: string; ipaB: string;
    answer: string; typeId: string; name: string; status: string;
  }>({
    word: "", ipa: "", audioUrl: "", hint: "",
    sentence: "",
    wordA: "", ipaA: "", wordB: "", ipaB: "",
    answer: "", typeId: "", name: "", status: "ACTIVE",
  });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [topicPage, setTopicPage] = useState(1);
  const [mapPage, setMapPage] = useState(1);

  const subcategories = useMemo(() => {
    const set = new Set<string>();
    for (const m of mapItems) {
      set.add(m.subcategory || UNCATEGORIZED);
    }
    return Array.from(set).sort();
  }, [mapItems]);

  const [activeSubcategory, setActiveSubcategory] = useState<string>(subcategories[0] || UNCATEGORIZED);

  // Reset active subcategory when subcategories change (e.g. tab switch)
  useEffect(() => {
    setActiveSubcategory(subcategories[0] || UNCATEGORIZED);
  }, [subcategories]);

  const filteredTopicItems = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return keyword
      ? topicItems.filter((t) => t.name.toLowerCase().includes(keyword) || t.description?.toLowerCase().includes(keyword))
      : topicItems;
  }, [searchTerm, topicItems]);

  const filteredMapItems = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return keyword
      ? mapItems.filter((m) => m.name.toLowerCase().includes(keyword) || m.requirement?.toLowerCase().includes(keyword))
      : mapItems;
  }, [searchTerm, mapItems]);

  const subcategoryMaps = useMemo(() => {
    return filteredMapItems.filter((m) => (m.subcategory || UNCATEGORIZED) === activeSubcategory);
  }, [filteredMapItems, activeSubcategory]);

  const topicTotalPages = Math.ceil(filteredTopicItems.length / PAGE_SIZE);
  const mapTotalPages = Math.ceil(subcategoryMaps.length / PAGE_SIZE);

  const pagedTopics = filteredTopicItems.slice((topicPage - 1) * PAGE_SIZE, topicPage * PAGE_SIZE);
  const pagedMaps = subcategoryMaps.slice((mapPage - 1) * PAGE_SIZE, mapPage * PAGE_SIZE);

  const resetTopicForm = () => setTopicForm({ editingId: null, name: "", description: "" });
  const resetMapForm = () => setMapForm({ editingId: null, name: "", requirement: "", status: "DRAFT", subcategory: "" });
  const resetExerciseForm = () => { setExerciseForm({ editingId: null, name: "", description: "", status: "DRAFT" }); setShowExerciseFormForMap(null); };

  type ExerciseMode = "listen_choose" | "speak_word" | "speak_minimal_pair" | "speak_sentence";

  const detectExerciseMode = (exerciseName: string): ExerciseMode => {
    const n = exerciseName.toLowerCase();
    if (n.includes("luyện tai") || n.includes("nghe")) return "listen_choose";
    if (n.includes("thử thách") || n.includes("cặp") || n.includes("đôi")) return "speak_minimal_pair";
    if (n.includes("thực chiến") || n.includes("câu")) return "speak_sentence";
    return "speak_word";
  };

  const serializeQuestionContent = (mode: ExerciseMode): string => {
    switch (mode) {
      case "listen_choose":
        return JSON.stringify({
          mode: "listen_choose",
          answerType: "phoneme",
          word: questionForm.word.trim(),
          ipa: questionForm.ipa.trim() || undefined,
          audioUrl: questionForm.audioUrl.trim() || undefined,
          targetPhoneme: questionForm.ipa.trim(),
          contrastPhonemes: [],
          skeleton: "",
        });
      case "speak_word":
        return JSON.stringify({
          word: questionForm.word.trim(),
          ipa: questionForm.ipa.trim() || undefined,
          audioUrl: questionForm.audioUrl.trim() || undefined,
          hint: questionForm.hint.trim() || undefined,
        });
      case "speak_minimal_pair":
        return JSON.stringify([
          { word: questionForm.wordA.trim(), ipa: questionForm.ipaA.trim() || undefined, audioUrl: undefined, hint: questionForm.hint.trim() || undefined },
          { word: questionForm.wordB.trim(), ipa: questionForm.ipaB.trim() || undefined, audioUrl: undefined },
        ]);
      case "speak_sentence":
        return JSON.stringify({
          mode: "speak_sentence",
          word: questionForm.sentence.trim(),
          ipa: questionForm.ipa.trim() || undefined,
          audioUrl: questionForm.audioUrl.trim() || undefined,
          hint: questionForm.hint.trim() || undefined,
        });
    }
  };

  const detectModeFromExercise = (exerciseId: string): ExerciseMode => {
    const ex = exerciseItems.find((e) => e.id === exerciseId);
    return ex ? detectExerciseMode(ex.name) : "speak_word";
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      word: "", ipa: "", audioUrl: "", hint: "",
      sentence: "",
      wordA: "", ipaA: "", wordB: "", ipaB: "",
      answer: "", typeId: questionTypes[0]?.id ?? "", name: "", status: "ACTIVE",
    });
    setEditingQuestionId(null);
    setShowQuestionFormForExercise(null);
  };

  const handleTabSwitch = (tab: "topics" | "maps") => {
    setActiveTab(tab);
    setSearchTerm("");
    setMessage(null);
    resetTopicForm();
    resetMapForm();
    resetExerciseForm();
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setTopicPage(1);
    setMapPage(1);
  };

  const submitTopic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = { name: topicForm.name.trim(), description: topicForm.description.trim() || null };

    try {
      const response = await fetch(
        topicForm.editingId ? `/api/admin/topics/${topicForm.editingId}` : "/api/admin/topics",
        { method: topicForm.editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      );
      const result = (await response.json()) as ApiResponse<{ topic: AdminTopicItem }>;
      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: getMessage(result, "Không lưu được chủ đề.") });
        return;
      }
      setTopicItems((current) =>
        topicForm.editingId
          ? current.map((item) => (item.id === result.data.topic.id ? result.data.topic : item))
          : [result.data.topic, ...current],
      );
      setMessage({ type: "success", text: topicForm.editingId ? "Đã cập nhật chủ đề." : "Đã tạo chủ đề." });
      resetTopicForm();
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const submitMap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = {
      name: mapForm.name.trim(),
      requirement: mapForm.requirement.trim() || null,
      status: mapForm.status,
      subcategory: mapForm.subcategory.trim() || null,
      ...(topicId ? { topicId } : {}),
    };

    try {
      const response = await fetch(
        mapForm.editingId ? `/api/admin/maps/${mapForm.editingId}` : "/api/admin/maps",
        { method: mapForm.editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      );
      const result = (await response.json()) as ApiResponse<{ map: AdminMapItem }>;
      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: getMessage(result, "Không lưu được learning map.") });
        return;
      }
      setMapItems((current) =>
        mapForm.editingId
          ? current.map((item) => (item.id === result.data.map.id ? result.data.map : item))
          : [result.data.map, ...current],
      );
      setMessage({ type: "success", text: mapForm.editingId ? "Đã cập nhật learning map." : "Đã tạo learning map." });
      resetMapForm();
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const submitExercise = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = {
      name: exerciseForm.name.trim(),
      description: exerciseForm.description.trim() || null,
      status: exerciseForm.status,
      levelId: levels[0]?.id ?? "",
      ...(topicId ? { topicId } : {}),
      ...(showExerciseFormForMap ? { mapId: showExerciseFormForMap } : {}),
    };

    try {
      const response = await fetch(
        exerciseForm.editingId ? `/api/admin/exercises/${exerciseForm.editingId}` : "/api/admin/exercises",
        { method: exerciseForm.editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      );
      const result = (await response.json()) as ApiResponse<{ exercise: AdminExerciseItem }>;
      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: getMessage(result, "Không lưu được bài tập.") });
        return;
      }
      setExerciseItems((current) =>
        exerciseForm.editingId
          ? current.map((item) => (item.id === result.data.exercise.id ? result.data.exercise : item))
          : [result.data.exercise, ...current],
      );
      setMessage({ type: "success", text: exerciseForm.editingId ? "Đã cập nhật bài tập." : "Đã tạo bài tập." });
      resetExerciseForm();
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchQuestions = useCallback(async (exerciseId: string) => {
    setLoadingQuestions(exerciseId);
    try {
      const response = await fetch(`/api/admin/questions?exerciseId=${exerciseId}`);
      const result = (await response.json()) as ApiResponse<{ questions: QuestionItem[] }>;
      if (response.ok && result.success) {
        setExerciseQuestions((prev) => ({ ...prev, [exerciseId]: result.data.questions }));
      }
    } catch {
      // silent
    } finally {
      setLoadingQuestions(null);
    }
  }, []);

  const toggleExerciseExpand = useCallback(
    (exerciseId: string) => {
      if (expandedExerciseId === exerciseId) {
        setExpandedExerciseId(null);
      } else {
        setExpandedExerciseId(exerciseId);
        if (!exerciseQuestions[exerciseId]) {
          fetchQuestions(exerciseId);
        }
      }
    },
    [expandedExerciseId, exerciseQuestions, fetchQuestions],
  );

  const submitQuestion = async (exerciseId: string) => {
    setIsSaving(true);
    setMessage(null);

    const isEditing = editingQuestionId !== null;
    const mode = detectModeFromExercise(exerciseId);
    const content = serializeQuestionContent(mode);

    const payload = {
      exerciseId,
      content,
      answer: questionForm.answer.trim(),
      typeId: questionForm.typeId || questionTypes[0]?.id || "",
      name: questionForm.name.trim() || null,
      status: questionForm.status,
    };

    try {
      const url = isEditing ? `/api/admin/questions/${editingQuestionId}` : "/api/admin/questions";
      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<{ question: QuestionItem }>;
      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: getMessage(result, "Không lưu được câu hỏi.") });
        return;
      }
      if (!isEditing) {
        setExerciseItems((current) =>
          current.map((e) => e.id === exerciseId ? { ...e, questionCount: e.questionCount + 1 } : e),
        );
      }
      setMessage({ type: "success", text: isEditing ? "Đã cập nhật câu hỏi." : "Đã tạo câu hỏi." });
      resetQuestionForm();
      fetchQuestions(exerciseId);
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuestion = async (exerciseId: string, questionId: string, label: string) => {
    const confirmed = window.confirm(`Xóa câu hỏi "${label}"?`);
    if (!confirmed) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResponse<{ deletedId: string }>;
      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: getMessage(result, "Không xóa được câu hỏi.") });
        return;
      }
      setExerciseItems((current) =>
        current.map((e) => e.id === exerciseId ? { ...e, questionCount: Math.max(0, e.questionCount - 1) } : e),
      );
      setMessage({ type: "success", text: "Đã xóa câu hỏi." });
      fetchQuestions(exerciseId);
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (kind: "topics" | "maps" | "exercises", id: string, displayName: string) => {
    const confirmed = window.confirm(`Xóa "${displayName}"?`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const endpoint = kind === "topics" ? "/api/admin/topics" : kind === "maps" ? "/api/admin/maps" : "/api/admin/exercises";
      const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });

      if (kind === "topics") {
        const result = (await response.json()) as ApiResponse<{ deletedId: string }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, "Không xóa được chủ đề.") });
          return;
        }
        setTopicItems((current) => current.filter((item) => item.id !== result.data.deletedId));
        if (topicForm.editingId === id) resetTopicForm();
      }

      if (kind === "maps") {
        const result = (await response.json()) as ApiResponse<{ map: AdminMapItem }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, "Không lưu trữ được learning map.") });
          return;
        }
        setMapItems((current) => current.map((item) => (item.id === result.data.map.id ? result.data.map : item)));
        if (mapForm.editingId === id) resetMapForm();
      }

      if (kind === "exercises") {
        const result = (await response.json()) as ApiResponse<{ deletedId: string }>;
        if (!response.ok || !result.success) {
          setMessage({ type: "error", text: getMessage(result, "Không xóa được bài tập.") });
          return;
        }
        setExerciseItems((current) => current.filter((item) => item.id !== result.data.deletedId));
        if (exerciseForm.editingId === id) resetExerciseForm();
      }

      setMessage({ type: "success", text: kind === "maps" ? "Đã lưu trữ learning map." : "Đã xóa mục dữ liệu." });
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const exercisesForMap = (mapId: string) => {
    const keyword = searchTerm.toLowerCase();
    return exerciseItems.filter(
      (e) => e.mapId === mapId && (!keyword || e.name.toLowerCase().includes(keyword) || e.description?.toLowerCase().includes(keyword)),
    );
  };

  const mapFormHasContent = mapForm.editingId !== null || mapForm.name !== "";
  const topicFormHasContent = topicForm.editingId !== null || topicForm.name !== "";

  return (
    <Card>
      <div className="p-6">
        {message && <AdminErrorBlock variant={message.type === "success" ? "success" : "error"} message={message.text} className="mb-4" />}

        {/* ─── Mode: no topicId → topic + map tabs ─── */}
        {!topicId && (
          <>
            <div className="mb-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="Nhóm dữ liệu nền">
              {(
                [
                  { id: "topics" as const, label: "Chủ đề" },
                  { id: "maps" as const, label: "Learning map" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`min-h-11 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${
                    activeTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "topics" && (
              <>
                <div className="mb-4">
                  <AdminSearchInput
                    id="admin-topic-search"
                    aria-label="Tìm kiếm chủ đề"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Tìm theo tên chủ đề..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Hiển thị {filteredTopicItems.length} / {topicItems.length} mục
                  </p>
                </div>

                {topicFormHasContent && (
                  <form onSubmit={submitTopic} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{topicForm.editingId ? "Sửa chủ đề" : "Tạo chủ đề"}</h3>
                        <p className="mt-1 text-sm text-slate-600">Chỉ xóa được khi chưa có bài tập hoặc sound group liên kết.</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={resetTopicForm}>
                        Hủy
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <TextInput id="topic-name" label="Tên" required value={topicForm.name} onChange={(v) => setTopicForm((f) => ({ ...f, name: v }))} />
                    </div>
                    <label className="block" htmlFor="topic-description">
                      <span className="mb-1 block text-sm font-semibold text-slate-700">Mô tả</span>
                      <textarea
                        id="topic-description"
                        value={topicForm.description}
                        onChange={(event) => setTopicForm((f) => ({ ...f, description: event.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                      />
                    </label>
                    <Button type="submit" size="sm" loading={isSaving}>
                      {topicForm.editingId ? "Lưu thay đổi" : "Tạo mới"}
                    </Button>
                  </form>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {pagedTopics.map((item) => (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
                      <p className="mt-3 text-xs text-slate-500">
                        {item.exerciseCount} bài tập · {item.soundGroupCount} sound group
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setTopicForm({ editingId: item.id, name: item.name, description: item.description ?? "" });
                            setTopicPage(1);
                          }}
                        >
                          Sửa
                        </Button>
                        <Button type="button" variant="ghost" size="sm" loading={isSaving} onClick={() => removeItem("topics", item.id, item.name)}>
                          Xóa
                        </Button>
                      </div>
                    </article>
                  ))}
                  {pagedTopics.length === 0 && <p className="col-span-full text-sm text-slate-500">Không có chủ đề nào.</p>}
                </div>

                {topicTotalPages > 1 && (
                  <Pagination currentPage={topicPage} totalPages={topicTotalPages} onPageChange={setTopicPage} className="mt-6" />
                )}
              </>
            )}

            {activeTab === "maps" && (
              <>
                <div className="mb-4">
                  <AdminSearchInput
                    id="admin-map-search"
                    aria-label="Tìm kiếm learning map"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Tìm theo tên learning map..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Hiển thị {filteredMapItems.length} / {mapItems.length} mục
                  </p>
                </div>

                {mapFormHasContent && (
                  <form onSubmit={submitMap} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-slate-900">{mapForm.editingId ? "Sửa learning map" : "Tạo learning map"}</h3>
                      <Button type="button" variant="ghost" size="sm" onClick={resetMapForm}>
                        Hủy
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <TextInput id="map-name" label="Tên" required value={mapForm.name} onChange={(v) => setMapForm((f) => ({ ...f, name: v }))} />
                      <TextInput id="map-subcategory" label="Subcategory" value={mapForm.subcategory} onChange={(v) => setMapForm((f) => ({ ...f, subcategory: v }))} />
                      <label className="block" htmlFor="map-status">
                        <span className="mb-1 block text-sm font-semibold text-slate-700">Trạng thái</span>
                        <select
                          id="map-status"
                          value={mapForm.status}
                          onChange={(event) => setMapForm((f) => ({ ...f, status: event.target.value }))}
                          className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                        >
                          {mapStatuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block" htmlFor="map-requirement">
                      <span className="mb-1 block text-sm font-semibold text-slate-700">Yêu cầu</span>
                      <textarea
                        id="map-requirement"
                        value={mapForm.requirement}
                        onChange={(event) => setMapForm((f) => ({ ...f, requirement: event.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                      />
                    </label>
                    <Button type="submit" size="sm" loading={isSaving}>
                      {mapForm.editingId ? "Lưu thay đổi" : "Tạo mới"}
                    </Button>
                  </form>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {pagedMaps.map((item) => (
                    <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-slate-900">{item.name}</h3>
                        <Badge variant={statusVariant(item.status)} size="sm">{item.status}</Badge>
                      </div>
                      {item.requirement && <p className="mt-2 text-sm text-slate-600">{item.requirement}</p>}
                      <p className="mt-3 text-xs text-slate-500">
                        {item.exerciseCount} bài tập · {item.progressCount} tiến trình
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setMapForm({ editingId: item.id, name: item.name, requirement: item.requirement ?? "", status: item.status, subcategory: item.subcategory ?? "" })
                          }
                        >
                          Sửa
                        </Button>
                      </div>
                    </article>
                  ))}
                  {pagedMaps.length === 0 && <p className="col-span-full text-sm text-slate-500">Không có learning map nào.</p>}
                </div>

                {mapTotalPages > 1 && (
                  <Pagination currentPage={mapPage} totalPages={mapTotalPages} onPageChange={setMapPage} className="mt-6" />
                )}
              </>
            )}
          </>
        )}

        {/* ─── Mode: topicId set → subcategory tabs + map cards ─── */}
        {topicId && (
          <>
            {/* Subcategory tabs */}
            <div className="mb-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="Nhóm âm">
              {subcategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeSubcategory === cat}
                  onClick={() => { setActiveSubcategory(cat); setMapPage(1); setExpandedMapId(null); }}
                  className={`min-h-11 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${
                    activeSubcategory === cat ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <AdminSearchInput
                id="admin-map-search"
                aria-label="Tìm kiếm sound group"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm theo tên sound group..."
              />
              <p className="mt-1 text-xs text-slate-500">
                Hiển thị {subcategoryMaps.length} / {mapItems.length} sound group
              </p>
            </div>

            {mapFormHasContent && (
              <form onSubmit={submitMap} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900">{mapForm.editingId ? "Sửa sound group" : "Tạo sound group"}</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={resetMapForm}>
                    Hủy
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <TextInput id="map-name" label="Tên" required value={mapForm.name} onChange={(v) => setMapForm((f) => ({ ...f, name: v }))} />
                  <TextInput id="map-subcategory" label="Subcategory" value={mapForm.subcategory} onChange={(v) => setMapForm((f) => ({ ...f, subcategory: v }))} />
                  <label className="block" htmlFor="map-status">
                    <span className="mb-1 block text-sm font-semibold text-slate-700">Trạng thái</span>
                    <select
                      id="map-status"
                      value={mapForm.status}
                      onChange={(event) => setMapForm((f) => ({ ...f, status: event.target.value }))}
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                    >
                      {mapStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block" htmlFor="map-requirement">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Yêu cầu</span>
                  <textarea
                    id="map-requirement"
                    value={mapForm.requirement}
                    onChange={(event) => setMapForm((f) => ({ ...f, requirement: event.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                  />
                </label>
                <Button type="submit" size="sm" loading={isSaving}>
                  {mapForm.editingId ? "Lưu thay đổi" : "Tạo mới"}
                </Button>
              </form>
            )}

            <div className="space-y-4">
              {pagedMaps.map((mapItem) => {
                const isExpanded = expandedMapId === mapItem.id;
                const mapExercises = exercisesForMap(mapItem.id);

                return (
                  <article key={mapItem.id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900">{mapItem.name}</h3>
                            <Badge variant={statusVariant(mapItem.status)} size="sm">{mapItem.status}</Badge>
                          </div>
                          {mapItem.subcategory && (
                            <p className="mt-1 text-xs text-slate-500">Subcategory: {mapItem.subcategory}</p>
                          )}
                          {mapItem.requirement && <p className="mt-1 text-sm text-slate-600">{mapItem.requirement}</p>}
                          <p className="mt-2 text-xs text-slate-500">
                            {mapItem.exerciseCount} bài tập · {mapItem.progressCount} tiến trình
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setMapForm({ editingId: mapItem.id, name: mapItem.name, requirement: mapItem.requirement ?? "", status: mapItem.status, subcategory: mapItem.subcategory ?? "" })
                            }
                          >
                            Sửa
                          </Button>
                          <button
                            type="button"
                            onClick={() => setExpandedMapId(isExpanded ? null : mapItem.id)}
                            className="min-h-9 inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "Thu gọn" : `Bài tập (${mapExercises.length})`}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-700">
                            {mapExercises.length} bài tập · {mapItem.exerciseCount} tổng
                          </span>
                          {showExerciseFormForMap !== mapItem.id && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setShowExerciseFormForMap(mapItem.id);
                                setExerciseForm({ editingId: null, name: "", description: "", status: "DRAFT" });
                              }}
                            >
                              + Thêm bài tập
                            </Button>
                          )}
                        </div>

                        {showExerciseFormForMap === mapItem.id && (
                          <form onSubmit={submitExercise} className="mb-4 rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                              <h5 className="text-sm font-bold text-blue-800">{exerciseForm.editingId ? "Sửa bài tập" : "Thêm bài tập mới"}</h5>
                              <Button type="button" variant="ghost" size="sm" onClick={resetExerciseForm}>Hủy</Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              <TextInput
                                id={`ex-name-${mapItem.id}`}
                                label="Tên bài tập"
                                required
                                value={exerciseForm.name}
                                onChange={(v) => setExerciseForm((f) => ({ ...f, name: v }))}
                              />
                              <label className="block" htmlFor={`ex-status-${mapItem.id}`}>
                                <span className="mb-1 block text-sm font-semibold text-slate-700">Trạng thái</span>
                                <select
                                  id={`ex-status-${mapItem.id}`}
                                  value={exerciseForm.status}
                                  onChange={(e) => setExerciseForm((f) => ({ ...f, status: e.target.value }))}
                                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                                >
                                  {exerciseStatuses.map((s) => (<option key={s} value={s}>{s}</option>))}
                                </select>
                              </label>
                            </div>
                            <label className="mt-3 block" htmlFor={`ex-desc-${mapItem.id}`}>
                              <span className="mb-1 block text-sm font-semibold text-slate-700">Mô tả</span>
                              <textarea
                                id={`ex-desc-${mapItem.id}`}
                                value={exerciseForm.description}
                                onChange={(e) => setExerciseForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
                              />
                            </label>
                            <div className="mt-3 flex justify-end">
                              <Button type="submit" size="sm" loading={isSaving}>
                                {exerciseForm.editingId ? "Lưu thay đổi" : "Tạo mới"}
                              </Button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-2">
                          {mapExercises.map((ex) => {
                            const isExpanded = expandedExerciseId === ex.id;
                            const questions = exerciseQuestions[ex.id] ?? [];
                            const isLoading = loadingQuestions === ex.id;
                            const isQuestionFormOpen = showQuestionFormForExercise === ex.id;
                            const currentMode = detectModeFromExercise(ex.id);
                            const currentModeLabel: Record<ExerciseMode, string> = {
                              listen_choose: "Luyện tai", speak_word: "Luyện miệng",
                              speak_minimal_pair: "Thử thách kép", speak_sentence: "Thực chiến",
                            };
                            return (
                              <div key={ex.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                {/* Exercise header — clickable */}
                                <button
                                  type="button"
                                  onClick={() => toggleExerciseExpand(ex.id)}
                                  className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-slate-50"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="truncate font-bold text-slate-900">{ex.name}</h5>
                                      <Badge variant={statusVariant(ex.status)} size="sm">{ex.status}</Badge>
                                    </div>
                                    {ex.description && <p className="mt-0.5 truncate text-xs text-slate-600">{ex.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="whitespace-nowrap text-xs text-slate-500">{ex.questionCount} câu hỏi</span>
                                    <span className={`text-sm transition-transform ${isExpanded ? "rotate-90" : ""}`}>▸</span>
                                  </div>
                                </button>

                                {/* Expanded: question list + CRUD */}
                                {isExpanded && (
                                  <div className="border-t border-slate-100 bg-slate-50 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-600">Danh sách câu hỏi</span>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => {
                                            setShowExerciseFormForMap(mapItem.id);
                                            setExerciseForm({ editingId: ex.id, name: ex.name, description: ex.description ?? "", status: ex.status });
                                          }}
                                        >
                                          Sửa bài tập
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => {
                                            resetQuestionForm();
                                            setShowQuestionFormForExercise(ex.id);
                                          }}
                                        >
                                          + Thêm câu hỏi
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Question form */}
                                    {isQuestionFormOpen && (
                                      <div className="mb-3 rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
                                        <div className="mb-2 flex items-center justify-between">
                                          <span className="text-xs font-bold text-blue-800">
                                            {editingQuestionId ? "Sửa" : "Thêm"} câu hỏi · {currentModeLabel[currentMode]}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={resetQuestionForm}
                                            className="text-xs text-slate-500 hover:text-slate-700"
                                          >
                                            Đóng
                                          </button>
                                        </div>
                                        <div className="space-y-2">
                                          {currentMode === "speak_word" && (
                                            <div className="grid grid-cols-2 gap-2">
                                              <input type="text" placeholder="Từ *"
                                                value={questionForm.word}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, word: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="IPA (vd: /bɔɪ/)"
                                                value={questionForm.ipa}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, ipa: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="Audio URL (tùy chọn)"
                                                value={questionForm.audioUrl}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, audioUrl: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="Gợi ý (tùy chọn)"
                                                value={questionForm.hint}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, hint: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                            </div>
                                          )}
                                          {currentMode === "listen_choose" && (
                                            <div className="grid grid-cols-2 gap-2">
                                              <input type="text" placeholder="Từ *"
                                                value={questionForm.word}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, word: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="IPA mục tiêu (vd: /ɔɪ/)"
                                                value={questionForm.ipa}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, ipa: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="Audio URL (tùy chọn)"
                                                value={questionForm.audioUrl}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, audioUrl: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                            </div>
                                          )}
                                          {currentMode === "speak_minimal_pair" && (
                                            <>
                                              <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="Từ A *"
                                                  value={questionForm.wordA}
                                                  onChange={(e) => setQuestionForm((f) => ({ ...f, wordA: e.target.value }))}
                                                  className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                />
                                                <input type="text" placeholder="IPA A (vd: /pɪn/)"
                                                  value={questionForm.ipaA}
                                                  onChange={(e) => setQuestionForm((f) => ({ ...f, ipaA: e.target.value }))}
                                                  className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                />
                                              </div>
                                              <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="Từ B *"
                                                  value={questionForm.wordB}
                                                  onChange={(e) => setQuestionForm((f) => ({ ...f, wordB: e.target.value }))}
                                                  className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                />
                                                <input type="text" placeholder="IPA B (vd: /pɛn/)"
                                                  value={questionForm.ipaB}
                                                  onChange={(e) => setQuestionForm((f) => ({ ...f, ipaB: e.target.value }))}
                                                  className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                />
                                              </div>
                                              <input type="text" placeholder="Gợi ý phân biệt (tùy chọn)"
                                                value={questionForm.hint}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, hint: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                            </>
                                          )}
                                          {currentMode === "speak_sentence" && (
                                            <div className="grid grid-cols-2 gap-2">
                                              <input type="text" placeholder="Câu *"
                                                value={questionForm.sentence}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, sentence: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="IPA (tùy chọn)"
                                                value={questionForm.ipa}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, ipa: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="Audio URL (tùy chọn)"
                                                value={questionForm.audioUrl}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, audioUrl: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                              <input type="text" placeholder="Gợi ý (tùy chọn)"
                                                value={questionForm.hint}
                                                onChange={(e) => setQuestionForm((f) => ({ ...f, hint: e.target.value }))}
                                                className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                              />
                                            </div>
                                          )}
                                          <div className="grid grid-cols-3 gap-2">
                                            <input
                                              type="text"
                                              placeholder={currentMode === "speak_minimal_pair" ? "wordA, wordB" : "Đáp án *"}
                                              value={questionForm.answer}
                                              onChange={(e) => setQuestionForm((f) => ({ ...f, answer: e.target.value }))}
                                              className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            />
                                            <select
                                              value={questionForm.typeId}
                                              onChange={(e) => setQuestionForm((f) => ({ ...f, typeId: e.target.value }))}
                                              className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            >
                                              {questionTypes.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                              ))}
                                            </select>
                                            <select
                                              value={questionForm.status}
                                              onChange={(e) => setQuestionForm((f) => ({ ...f, status: e.target.value }))}
                                              className="rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            >
                                              {["ACTIVE", "DRAFT", "ARCHIVED"].map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="flex justify-end gap-2">
                                            <Button type="button" variant="ghost" size="sm" onClick={resetQuestionForm}>
                                              Hủy
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              loading={isSaving}
                                              disabled={currentMode === "speak_minimal_pair"
                                                ? !(questionForm.wordA.trim() && questionForm.wordB.trim() && questionForm.answer.trim())
                                                : !questionForm.answer.trim()
                                              }
                                              onClick={() => submitQuestion(ex.id)}
                                            >
                                              {editingQuestionId ? "Lưu" : "Tạo"}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Questions list */}
                                    {isLoading ? (
                                      <p className="text-xs text-slate-500">Đang tải...</p>
                                    ) : questions.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {questions.map((q) => {
                                          let displayLabel = q.content;
                                          try {
                                            const parsed = JSON.parse(q.content);
                                            if (Array.isArray(parsed)) {
                                              displayLabel = parsed.map((p: Record<string, unknown>) => `${p.word} ${p.ipa ?? ""}`).join(" vs ");
                                            } else if (parsed.word || parsed.sentence) {
                                              displayLabel = parsed.word ?? parsed.sentence ?? q.content;
                                              if (parsed.ipa) displayLabel += ` ${parsed.ipa}`;
                                            }
                                          } catch { /* raw string */ }
                                          return (
                                          <div key={q.id} className="flex items-start justify-between gap-2 rounded bg-white p-2 border border-slate-100">
                                            <div className="min-w-0 flex-1">
                                              <p className="text-xs font-medium text-slate-900 truncate">{displayLabel}</p>
                                              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                                                <span>Đáp án: <strong className="text-slate-700">{q.answer}</strong></span>
                                                <span>·</span>
                                                <span>{q.type.name}</span>
                                                <span>·</span>
                                                <span>{q.score} điểm</span>
                                              </div>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  const mode = detectModeFromExercise(ex.id);
                                                  setEditingQuestionId(q.id);
                                                  setShowQuestionFormForExercise(ex.id);
                                                  let parsed: Record<string, unknown> = {};
                                                  try { parsed = JSON.parse(q.content); } catch { /* raw string */ }
                                                  const qArr = Array.isArray(parsed) ? parsed : [parsed];
                                                  const q0 = (qArr[0] ?? {}) as Record<string, unknown>;
                                                  const q1 = (qArr[1] ?? {}) as Record<string, unknown>;
                                                  setQuestionForm({
                                                    word: (parsed as Record<string, unknown>).word as string ?? (q0.word as string) ?? "",
                                                    ipa: (parsed as Record<string, unknown>).ipa as string ?? (q0.ipa as string) ?? "",
                                                    audioUrl: (parsed as Record<string, unknown>).audioUrl as string ?? (q0.audioUrl as string) ?? "",
                                                    hint: (parsed as Record<string, unknown>).hint as string ?? (q0.hint as string) ?? "",
                                                    sentence: mode === "speak_sentence" ? ((parsed as Record<string, unknown>).word as string ?? "") : "",
                                                    wordA: mode === "speak_minimal_pair" ? (q0.word as string ?? "") : "",
                                                    ipaA: mode === "speak_minimal_pair" ? (q0.ipa as string ?? "") : "",
                                                    wordB: mode === "speak_minimal_pair" ? (q1.word as string ?? "") : "",
                                                    ipaB: mode === "speak_minimal_pair" ? (q1.ipa as string ?? "") : "",
                                                    answer: q.answer,
                                                    typeId: q.type.id,
                                                    name: q.name ?? "",
                                                    status: q.status,
                                                  });
                                                }}
                                              >
                                                Sửa
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                loading={isSaving}
                                                onClick={() => deleteQuestion(ex.id, q.id, q.content.slice(0, 50))}
                                              >
                                                Xóa
                                              </Button>
                                            </div>
                                          </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500">Chưa có câu hỏi nào.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {mapExercises.length === 0 && (
                            <p className="text-sm text-slate-500">Chưa có bài tập nào. Nhấn &quot;+ Thêm bài tập&quot; để bắt đầu.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
              {pagedMaps.length === 0 && <p className="text-sm text-slate-500">Không có sound group nào trong nhóm này.</p>}
            </div>

            {mapTotalPages > 1 && (
              <Pagination currentPage={mapPage} totalPages={mapTotalPages} onPageChange={setMapPage} className="mt-6" />
            )}
          </>
        )}
      </div>
    </Card>
  );
}
