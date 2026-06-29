"use client";

import { FormEvent, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type AdminExercise = {
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

export type AdminExerciseOption = {
  id: string;
  name: string;
};

type ExerciseManagementProps = {
  exercises: AdminExercise[];
  topics: AdminExerciseOption[];
  levels: AdminExerciseOption[];
  maps: AdminExerciseOption[];
  questionTypes: AdminExerciseOption[];
};

type ExerciseFormState = {
  name: string;
  description: string;
  topicId: string;
  levelId: string;
  mapId: string;
  status: string;
};

type AdminExerciseApiItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  questionCount: number;
  topic: AdminExerciseOption;
  level: AdminExerciseOption;
  map: AdminExerciseOption;
  totalQuestions?: number;
  attemptCount: number;
};

type AdminQuestion = {
  id: string;
  name: string | null;
  content: string;
  status: string;
  score: number;
  answer: string;
  type: AdminExerciseOption;
  options: Array<{
    id: string;
    content: string;
  }>;
};

type AdminQuestionApiItem = AdminQuestion & {
  exerciseId?: string;
};

type QuestionFormState = {
  name: string;
  typeId: string;
  content: string;
  answer: string;
  score: string;
  status: string;
  optionsText: string;
};

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

const filters = ["ALL", "ACTIVE", "LOCKED", "DRAFT", "ARCHIVED"];
const statuses = ["ACTIVE", "LOCKED", "DRAFT", "ARCHIVED"];
const questionStatuses = ["ACTIVE", "DRAFT", "NEEDS_REVIEW", "ARCHIVED"];

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "LOCKED" || status === "DRAFT") return "warning" as const;
  if (status === "ARCHIVED") return "error" as const;
  return "default" as const;
}

function toFormState(exercise: AdminExercise | null, defaults: Pick<ExerciseFormState, "topicId" | "levelId" | "mapId">): ExerciseFormState {
  return {
    name: exercise?.name ?? "",
    description: exercise?.description ?? "",
    topicId: exercise?.topicId ?? defaults.topicId,
    levelId: exercise?.levelId ?? defaults.levelId,
    mapId: exercise?.mapId ?? defaults.mapId,
    status: exercise?.status ?? "DRAFT",
  };
}

function toQuestionFormState(question: AdminQuestion | null, defaultTypeId: string): QuestionFormState {
  return {
    name: question?.name ?? "",
    typeId: question?.type.id ?? defaultTypeId,
    content: question?.content ?? "",
    answer: question?.answer ?? "",
    score: question?.score ? String(question.score) : "10",
    status: question?.status ?? "DRAFT",
    optionsText: question?.options.map((option) => option.content).join("\n") ?? "",
  };
}

function normalizeExercise(apiItem: AdminExerciseApiItem): AdminExercise {
  return {
    id: apiItem.id,
    name: apiItem.name,
    description: apiItem.description,
    topicId: apiItem.topic.id,
    topic: apiItem.topic.name,
    levelId: apiItem.level.id,
    level: apiItem.level.name,
    mapId: apiItem.map.id,
    map: apiItem.map.name,
    questionCount: apiItem.questionCount,
    attemptCount: apiItem.attemptCount,
    status: apiItem.status,
  };
}

function normalizeQuestion(apiItem: AdminQuestionApiItem): AdminQuestion {
  return {
    id: apiItem.id,
    name: apiItem.name,
    content: apiItem.content,
    status: apiItem.status,
    score: apiItem.score,
    answer: apiItem.answer,
    type: apiItem.type,
    options: apiItem.options,
  };
}

function getMessage(payload: ApiResponse<unknown>, fallback: string) {
  return payload.success ? fallback : payload.error?.message || fallback;
}

function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "number";
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
      />
    </label>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        id={id}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ExerciseManagement({ exercises, topics, levels, maps, questionTypes }: ExerciseManagementProps) {
  const defaults = useMemo(
    () => ({
      topicId: topics[0]?.id ?? "",
      levelId: levels[0]?.id ?? "",
      mapId: maps[0]?.id ?? "",
    }),
    [levels, maps, topics],
  );
  const [items, setItems] = useState(exercises);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => toFormState(null, defaults));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [questionExerciseId, setQuestionExerciseId] = useState<string | null>(exercises[0]?.id ?? null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [questionsLoadedFor, setQuestionsLoadedFor] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState(() => toQuestionFormState(null, questionTypes[0]?.id ?? ""));
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isQuestionSaving, setIsQuestionSaving] = useState(false);
  const [questionMessage, setQuestionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedExercise = useMemo(
    () => (editingId ? items.find((exercise) => exercise.id === editingId) ?? null : null),
    [editingId, items],
  );
  const filteredExercises = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((exercise) => exercise.status === filterStatus)),
    [items, filterStatus],
  );
  const questionExercise = useMemo(
    () => (questionExerciseId ? items.find((exercise) => exercise.id === questionExerciseId) ?? null : null),
    [items, questionExerciseId],
  );
  const referenceDataReady = topics.length > 0 && levels.length > 0 && maps.length > 0;
  const questionTypeReady = questionTypes.length > 0;

  const updateForm = (field: keyof ExerciseFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateQuestionForm = (field: keyof QuestionFormState, value: string) => {
    setQuestionForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(toFormState(null, defaults));
    setMessage(null);
  };

  const startEdit = (exercise: AdminExercise) => {
    setEditingId(exercise.id);
    setForm(toFormState(exercise, defaults));
    setMessage(null);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!referenceDataReady) {
      setMessage({ type: "error", text: "Cần có topic, level và learning map trước khi tạo bài tập." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      topicId: form.topicId,
      levelId: form.levelId,
      mapId: form.mapId,
      status: form.status,
    };

    try {
      const response = await fetch(editingId ? `/api/admin/exercises/${editingId}` : "/api/admin/exercises", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<{ exercise: AdminExerciseApiItem }>;

      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: getMessage(result, "Không lưu được bài tập.") });
        return;
      }

      const nextExercise = normalizeExercise(result.data.exercise);
      setItems((current) =>
        editingId
          ? current.map((exercise) => (exercise.id === nextExercise.id ? nextExercise : exercise))
          : [nextExercise, ...current],
      );
      setMessage({ type: "success", text: editingId ? "Đã cập nhật bài tập." : "Đã tạo bài tập mới." });
      if (!questionExerciseId) {
        setQuestionExerciseId(nextExercise.id);
      }
      setEditingId(null);
      setForm(toFormState(null, defaults));
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const archiveExercise = async (exercise: AdminExercise) => {
    if (exercise.status === "ARCHIVED") return;

    const confirmed = window.confirm(`Lưu trữ bài tập "${exercise.name}"? Bài này sẽ không hiện cho người học.`);
    if (!confirmed) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/exercises/${exercise.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiResponse<{ exercise: AdminExerciseApiItem }>;

      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: getMessage(result, "Không lưu trữ được bài tập.") });
        return;
      }

      const archived = normalizeExercise(result.data.exercise);
      setItems((current) => current.map((item) => (item.id === archived.id ? archived : item)));
      setMessage({ type: "success", text: "Đã lưu trữ bài tập." });

      if (editingId === exercise.id) {
        resetForm();
      }
    } catch {
      setMessage({ type: "error", text: "Không kết nối được API admin." });
    } finally {
      setIsSaving(false);
    }
  };

  const topicOptions = topics.map((topic) => ({ value: topic.id, label: topic.name }));
  const levelOptions = levels.map((level) => ({ value: level.id, label: level.name }));
  const mapOptions = maps.map((map) => ({ value: map.id, label: map.name }));
  const statusOptions = statuses.map((status) => ({ value: status, label: status }));
  const questionTypeOptions = questionTypes.map((type) => ({ value: type.id, label: type.name }));
  const questionStatusOptions = questionStatuses.map((status) => ({ value: status, label: status }));
  const exerciseSelectOptions = items.map((exercise) => ({ value: exercise.id, label: exercise.name }));

  const loadQuestions = async (exerciseId = questionExerciseId) => {
    if (!exerciseId) {
      setQuestionMessage({ type: "error", text: "Hãy chọn bài tập trước." });
      return;
    }

    setIsQuestionLoading(true);
    setQuestionMessage(null);

    try {
      const response = await fetch(`/api/admin/exercises/${exerciseId}/questions`);
      const result = (await response.json()) as ApiResponse<{ questions: AdminQuestionApiItem[] }>;

      if (!response.ok || !result.success) {
        setQuestionMessage({ type: "error", text: getMessage(result, "Không tải được câu hỏi.") });
        return;
      }

      setQuestions(result.data.questions.map(normalizeQuestion));
      setQuestionsLoadedFor(exerciseId);
      setEditingQuestionId(null);
      setQuestionForm(toQuestionFormState(null, questionTypes[0]?.id ?? ""));
      setQuestionMessage({ type: "success", text: "Đã tải danh sách câu hỏi." });
    } catch {
      setQuestionMessage({ type: "error", text: "Không kết nối được API câu hỏi." });
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionForm(toQuestionFormState(null, questionTypes[0]?.id ?? ""));
    setQuestionMessage(null);
  };

  const startEditQuestion = (question: AdminQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionForm(toQuestionFormState(question, questionTypes[0]?.id ?? ""));
    setQuestionMessage(null);
  };

  const parseOptions = () => {
    const options = questionForm.optionsText
      .split(/\r?\n/)
      .map((option) => option.trim())
      .filter(Boolean);

    return options.length > 0 ? options : null;
  };

  const submitQuestionForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!questionExerciseId) {
      setQuestionMessage({ type: "error", text: "Hãy chọn bài tập trước." });
      return;
    }

    if (!questionTypeReady) {
      setQuestionMessage({ type: "error", text: "Cần có QuestionType trong database trước khi tạo câu hỏi." });
      return;
    }

    setIsQuestionSaving(true);
    setQuestionMessage(null);

    const options = parseOptions();
    const payload = {
      name: questionForm.name.trim() || null,
      typeId: questionForm.typeId,
      content: questionForm.content.trim(),
      answer: questionForm.answer.trim(),
      score: questionForm.score ? Number(questionForm.score) : 10,
      status: questionForm.status,
      options,
    };

    try {
      const response = await fetch(
        editingQuestionId ? `/api/admin/questions/${editingQuestionId}` : `/api/admin/exercises/${questionExerciseId}/questions`,
        {
          method: editingQuestionId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as ApiResponse<{ question: AdminQuestionApiItem; questionCount: number }>;

      if (!response.ok || !result.success) {
        setQuestionMessage({ type: "error", text: getMessage(result, "Không lưu được câu hỏi.") });
        return;
      }

      const nextQuestion = normalizeQuestion(result.data.question);
      setQuestions((current) =>
        editingQuestionId
          ? current.map((question) => (question.id === nextQuestion.id ? nextQuestion : question))
          : [...current, nextQuestion],
      );
      setItems((current) =>
        current.map((exercise) =>
          exercise.id === questionExerciseId ? { ...exercise, questionCount: result.data.questionCount } : exercise,
        ),
      );
      setEditingQuestionId(null);
      setQuestionForm(toQuestionFormState(null, questionTypes[0]?.id ?? ""));
      setQuestionsLoadedFor(questionExerciseId);
      setQuestionMessage({ type: "success", text: editingQuestionId ? "Đã cập nhật câu hỏi." : "Đã tạo câu hỏi." });
    } catch {
      setQuestionMessage({ type: "error", text: "Không kết nối được API câu hỏi." });
    } finally {
      setIsQuestionSaving(false);
    }
  };

  const archiveQuestion = async (question: AdminQuestion) => {
    if (question.status === "ARCHIVED") return;

    const confirmed = window.confirm(`Lưu trữ câu hỏi "${question.name || question.content.slice(0, 40)}"?`);
    if (!confirmed) return;

    setIsQuestionSaving(true);
    setQuestionMessage(null);

    try {
      const response = await fetch(`/api/admin/questions/${question.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiResponse<{ question: AdminQuestionApiItem; questionCount: number }>;

      if (!response.ok || !result.success) {
        setQuestionMessage({ type: "error", text: getMessage(result, "Không lưu trữ được câu hỏi.") });
        return;
      }

      const archived = normalizeQuestion(result.data.question);
      setQuestions((current) => current.map((item) => (item.id === archived.id ? archived : item)));
      if (questionExerciseId) {
        setItems((current) =>
          current.map((exercise) =>
            exercise.id === questionExerciseId ? { ...exercise, questionCount: result.data.questionCount } : exercise,
          ),
        );
      }
      if (editingQuestionId === question.id) {
        resetQuestionForm();
      }
      setQuestionMessage({ type: "success", text: "Đã lưu trữ câu hỏi." });
    } catch {
      setQuestionMessage({ type: "error", text: "Không kết nối được API câu hỏi." });
    } finally {
      setIsQuestionSaving(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quản lý bài tập</h2>
            <p className="mt-1 text-sm text-slate-600">Tổng số: {items.length} bài tập</p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <form onSubmit={submitForm} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{editingId ? "Sửa bài tập" : "Tạo bài tập mới"}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Bài mới nên để `DRAFT` đến khi câu hỏi và audio được kiểm tra.
                </p>
              </div>
              {editingId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  Hủy sửa
                </Button>
              )}
            </div>

            {!referenceDataReady && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800" role="alert">
                Cần có ít nhất một topic, level và learning map trong database trước khi tạo bài tập.
              </div>
            )}

            {message && (
              <div
                className={`rounded-lg border p-3 text-sm font-medium ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
                role={message.type === "error" ? "alert" : "status"}
              >
                {message.text}
              </div>
            )}

            <TextField id="exercise-name" label="Tên bài tập" required value={form.name} onChange={(value) => updateForm("name", value)} />

            <label className="block" htmlFor="exercise-description">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Mô tả</span>
              <textarea
                id="exercise-description"
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SelectField id="exercise-topic" label="Chủ đề" value={form.topicId} options={topicOptions} onChange={(value) => updateForm("topicId", value)} />
              <SelectField id="exercise-level" label="Cấp độ" value={form.levelId} options={levelOptions} onChange={(value) => updateForm("levelId", value)} />
              <SelectField id="exercise-map" label="Nhóm âm" value={form.mapId} options={mapOptions} onChange={(value) => updateForm("mapId", value)} />
              <SelectField id="exercise-status" label="Trạng thái" value={form.status} options={statusOptions} onChange={(value) => updateForm("status", value)} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" loading={isSaving} disabled={!referenceDataReady} size="sm">
                {editingId ? "Lưu thay đổi" : "Tạo bài tập"}
              </Button>
              {selectedExercise && selectedExercise.status !== "ARCHIVED" && (
                <Button type="button" variant="error" size="sm" loading={isSaving} onClick={() => archiveExercise(selectedExercise)}>
                  Lưu trữ bài tập
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto" role="group" aria-label="Lọc bài tập theo trạng thái">
          {filters.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`min-h-11 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${
                filterStatus === status ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "ALL" ? "Tất cả" : status}
            </button>
          ))}
        </div>

        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <SelectField
                id="question-exercise"
                label="Quản lý câu hỏi của bài tập"
                value={questionExerciseId ?? ""}
                options={exerciseSelectOptions}
                onChange={(value) => {
                  setQuestionExerciseId(value);
                  setQuestions([]);
                  setQuestionsLoadedFor(null);
                  setEditingQuestionId(null);
                  setQuestionForm(toQuestionFormState(null, questionTypes[0]?.id ?? ""));
                  setQuestionMessage(null);
                }}
              />
            </div>
            <Button type="button" variant="secondary" size="sm" loading={isQuestionLoading} disabled={!questionExerciseId} onClick={() => loadQuestions()}>
              Tải câu hỏi
            </Button>
          </div>

          {questionExercise && (
            <p className="mb-4 text-sm text-slate-600">
              Bài đang chọn: <span className="font-bold text-slate-900">{questionExercise.name}</span>
            </p>
          )}

          {!questionTypeReady && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800" role="alert">
              Cần có QuestionType trong database trước khi tạo câu hỏi.
            </div>
          )}

          {questionMessage && (
            <div
              className={`mb-4 rounded-lg border p-3 text-sm font-medium ${
                questionMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
              role={questionMessage.type === "error" ? "alert" : "status"}
            >
              {questionMessage.text}
            </div>
          )}

          <form onSubmit={submitQuestionForm} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{editingQuestionId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h3>
                <p className="mt-1 text-sm text-slate-600">Mỗi dòng là một lựa chọn. Bài nói có thể để trống phần lựa chọn.</p>
              </div>
              {editingQuestionId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetQuestionForm}>
                  Hủy sửa câu hỏi
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TextField id="question-name" label="Tên câu hỏi" value={questionForm.name} onChange={(value) => updateQuestionForm("name", value)} />
              <TextField
                id="question-score"
                label="Điểm câu hỏi"
                type="number"
                required
                value={questionForm.score}
                onChange={(value) => updateQuestionForm("score", value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SelectField
                id="question-type"
                label="Loại câu hỏi"
                value={questionForm.typeId}
                options={questionTypeOptions}
                onChange={(value) => updateQuestionForm("typeId", value)}
              />
              <SelectField
                id="question-status"
                label="Trạng thái câu hỏi"
                value={questionForm.status}
                options={questionStatusOptions}
                onChange={(value) => updateQuestionForm("status", value)}
              />
            </div>

            <label className="block" htmlFor="question-content">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Nội dung câu hỏi</span>
              <textarea
                id="question-content"
                required
                value={questionForm.content}
                onChange={(event) => updateQuestionForm("content", event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
              />
            </label>

            <TextField id="question-answer" label="Đáp án đúng" required value={questionForm.answer} onChange={(value) => updateQuestionForm("answer", value)} />

            <label className="block" htmlFor="question-options">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Lựa chọn trả lời</span>
              <textarea
                id="question-options"
                value={questionForm.optionsText}
                onChange={(event) => updateQuestionForm("optionsText", event.target.value)}
                rows={4}
                placeholder="/i/\n/i:/"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
              />
            </label>

            <Button type="submit" size="sm" loading={isQuestionSaving} disabled={!questionExerciseId || !questionTypeReady}>
              {editingQuestionId ? "Lưu câu hỏi" : "Thêm câu hỏi"}
            </Button>
          </form>

          {questionsLoadedFor !== questionExerciseId && questionExerciseId && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Bấm `Tải câu hỏi` để xem và sửa câu hỏi của bài đang chọn.
            </div>
          )}

          {questionsLoadedFor === questionExerciseId && (
            <div className="space-y-3">
              {questions.map((question) => (
                <article key={question.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{question.name || question.content.slice(0, 80)}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {question.type.name} - {question.score} điểm - đáp án: <span className="font-semibold">{question.answer}</span>
                      </p>
                    </div>
                    <Badge variant={question.status === "ACTIVE" ? "success" : question.status === "ARCHIVED" ? "error" : "warning"} size="sm">
                      {question.status}
                    </Badge>
                  </div>
                  <p className="mb-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{question.content}</p>
                  {question.options.length > 0 && (
                    <ul className="mb-3 flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <li key={option.id} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                          {option.content}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEditQuestion(question)}>
                      Sửa câu hỏi
                    </Button>
                    {question.status !== "ARCHIVED" && (
                      <Button type="button" variant="ghost" size="sm" loading={isQuestionSaving} onClick={() => archiveQuestion(question)}>
                        Lưu trữ câu hỏi
                      </Button>
                    )}
                  </div>
                </article>
              ))}

              {questions.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                  Bài tập này chưa có câu hỏi.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredExercises.map((exercise) => (
            <article key={exercise.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="flex-1 font-semibold text-slate-900">{exercise.name}</h3>
                  <Badge variant={statusVariant(exercise.status)} size="sm">
                    {exercise.status}
                  </Badge>
                </div>

                {exercise.description && <p className="mb-4 text-sm text-slate-600">{exercise.description}</p>}

                <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Chủ đề</dt>
                    <dd className="font-semibold text-slate-800">{exercise.topic}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Cấp độ</dt>
                    <dd className="font-semibold text-slate-800">{exercise.level}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Câu hỏi đang dùng</dt>
                    <dd className="font-semibold text-slate-800">{exercise.questionCount}</dd>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Lượt làm</dt>
                    <dd className="font-semibold text-slate-800">{exercise.attemptCount}</dd>
                  </div>
                </dl>

                <div className="mb-4 text-xs text-slate-500">
                  <p>Map: {exercise.map}</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(exercise)}>
                    Sửa
                  </Button>
                  {exercise.status !== "ARCHIVED" && (
                    <Button type="button" variant="ghost" size="sm" loading={isSaving} onClick={() => archiveExercise(exercise)}>
                      Lưu trữ
                    </Button>
                  )}
                </div>
            </article>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p>Không có bài tập nào</p>
          </div>
        )}
      </div>
    </Card>
  );
}
