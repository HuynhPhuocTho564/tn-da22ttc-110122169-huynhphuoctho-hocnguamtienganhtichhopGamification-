"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";
import { useWaveformRecorder, type RecorderLevel } from "@/hooks/useWaveformRecorder";
import SpeakFeedbackSheet from "./SpeakFeedbackSheet";

type SpeakMinimalPairsQuestionProps = {
  question: ExerciseQuestion;
  onNext: (correct: boolean, transcript: string) => void;
};

type WordPrompt = { word: string; ipa?: string; audioUrl?: string; hint?: string };

// parsePairPrompt (chuyển từ engine — chỉ component này dùng)
function parsePairPrompt(content: string): [WordPrompt, WordPrompt] {
  try {
    const parsed = JSON.parse(content) as Array<Partial<WordPrompt>>;
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return [
        {
          word: String(parsed[0].word ?? "Word 1"),
          ipa: parsed[0].ipa ? String(parsed[0].ipa) : undefined,
          audioUrl: parsed[0].audioUrl ? String(parsed[0].audioUrl) : undefined,
          hint: parsed[0].hint ? String(parsed[0].hint) : undefined,
        },
        {
          word: String(parsed[1].word ?? "Word 2"),
          ipa: parsed[1].ipa ? String(parsed[1].ipa) : undefined,
          audioUrl: parsed[1].audioUrl ? String(parsed[1].audioUrl) : undefined,
          hint: parsed[1].hint ? String(parsed[1].hint) : undefined,
        },
      ];
    }
  } catch {
    // Plain text fallback below.
  }
  const words = content.split(/[-,|]/).map((i) => i.trim()).filter(Boolean);
  return [{ word: words[0] ?? "Word 1" }, { word: words[1] ?? "Word 2" }];
}

type SpeechRecognitionLike = {
  continuous: boolean; lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window &
    typeof globalThis & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
}

function AudioButton({ audioUrl, label }: { audioUrl?: string; label: string }) {
  if (!audioUrl) return null;
  const play = () => {
    const a = new Audio(audioUrl);
    a.play().catch((e) => console.warn("audio failed:", e));
  };
  return (
    <button type="button" onClick={play} aria-label={label}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500">
      {label}
    </button>
  );
}

function hintText(level: RecorderLevel): { text: string; color: string } {
  switch (level) {
    case "silence": return { text: "🗣️ Nói to hơn", color: "text-neutral-500" };
    case "normal": return { text: "✅ Âm lượng tốt", color: "text-success-600" };
    case "loud": return { text: "⚠️ Nói nhỏ lại", color: "text-warning-600" };
  }
}

export default function SpeakMinimalPairsQuestion({ question, onNext }: SpeakMinimalPairsQuestionProps) {
  const pairs = useMemo(() => parsePairPrompt(question.content), [question.content]);
  const [statuses, setStatuses] = useState<Array<"idle" | "recording" | "recorded">>(["idle", "idle"]);
  const [transcripts, setTranscripts] = useState(["", ""]);
  const [overallStatus, setOverallStatus] = useState<"idle" | "processing" | "correct" | "incorrect">("idle");
  const [showWords, setShowWords] = useState<[boolean, boolean]>([false, false]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder0 = useWaveformRecorder();
  const recorder1 = useWaveformRecorder();
  const getRecorder = (index: number) => (index === 0 ? recorder0 : recorder1);

  useEffect(() => {
    setStatuses(["idle", "idle"]); setTranscripts(["", ""]); setOverallStatus("idle");
    setShowWords([false, false]); setErrorMessage(null);
    recorder0.reset();
    recorder1.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const canCheck = statuses[0] === "recorded" && statuses[1] === "recorded";
  const combinedTranscript = transcripts.filter(Boolean).join(" ");

  const startRecording = (index: number) => {
    const Ctor = getSpeechCtor();
    if (!Ctor) { setErrorMessage("Trình duyệt không hỗ trợ Web Speech API. Hãy dùng Chrome/Edge."); return; }
    const recorder = getRecorder(index);
    // Stop cột kia nếu đang recording (tránh 2 stream mic song song)
    const otherRecorder = getRecorder(1 - index);
    if (statuses[1 - index] === "recording") {
      otherRecorder.stop();
      setStatuses((cur) => cur.map((item, i) => (i === 1 - index && item === "recording" ? "recorded" : item)));
    }
    const recog = new Ctor();
    recog.continuous = false; recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setTranscripts((cur) => cur.map((item, i) => (i === index ? t : item)));
      setStatuses((cur) => cur.map((item, i) => (i === index ? "recorded" : item)));
      recorder.stop();
    };
    recog.onerror = (e) => {
      setStatuses((cur) => cur.map((item, i) => (i === index ? "idle" : item)));
      const denied = e.error === "not-allowed" || e.error === "service-not-allowed";
      setErrorMessage(
        denied
          ? "🔒 Microphone bị chặn. Cấp quyền: click icon 🔒 bên trái thanh địa chỉ → Site settings → Microphone → Allow, rồi reload trang."
          : "Không nghe thấy giọng nói. Nói to, rõ, bằng tiếng Anh. Thử lại.",
      );
      recorder.reset();
    };
    recog.onend = () => setStatuses((cur) => cur.map((item, i) => (i === index && item === "recording" ? "idle" : item)));
    recognitionRef.current = recog;
    setErrorMessage(null);
    recorder.reset(); // clearWaveform xóa sóng cũ cột này trước thu mới
    setStatuses((cur) => cur.map((item, i) => (i === index ? "recording" : item)));
    void recorder.start();
    try {
      recog.start();
      window.setTimeout(() => { try { recog.stop(); } catch { /* */ } }, 5000);
    } catch (e) {
      console.error("recognition failed:", e);
      setErrorMessage("Không bắt đầu ghi âm được.");
      setStatuses((cur) => cur.map((item, i) => (i === index ? "idle" : item)));
    }
  };

  const checkBothAnswers = () => {
    setOverallStatus("processing");
    window.setTimeout(() => {
      const ok0 = normalizeAnswer(transcripts[0]) === normalizeAnswer(pairs[0].word);
      const ok1 = normalizeAnswer(transcripts[1]) === normalizeAnswer(pairs[1].word);
      setOverallStatus(ok0 && ok1 ? "correct" : "incorrect");
    }, 400);
  };

  const masked = (w: string) => "•".repeat(Math.max(w.length, 3));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-2xl border-2 border-warning-400 bg-gradient-to-br from-warning-50 via-white to-neutral-50 p-8 shadow-lg">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-warning-100 px-5 py-2 text-sm font-bold uppercase tracking-wider text-warning-800">⚔️ Thử thách kép</span>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-widest text-neutral-900">Minimal Pairs</h2>
          <p className="mt-2 text-lg text-neutral-600">{question.name || "Đọc lần lượt hai từ"}</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border-2 border-warning-400 bg-warning-50 p-5 text-center font-bold text-warning-800" role="alert">⚠️ {errorMessage}</div>
        )}

        {/* 2 cột: IPA trên + từ ẩn + audio + waveform + nút thu */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {pairs.map((pair, index) => {
            const recorder = getRecorder(index);
            return (
            <div key={`${pair.word}-${index}`} className="rounded-xl border-2 border-warning-200 bg-gradient-to-br from-white to-warning-50 p-6 transition-all hover:border-warning-400">
              {/* IPA trên (hiện luôn) */}
              {pair.ipa && <p className="mb-3 text-center font-ipa text-3xl font-bold text-warning-600">{pair.ipa}</p>}
              {/* Từ ẩn (toggle) */}
              <div className="mb-4 text-center">
                <p className="text-3xl font-black uppercase tracking-tight text-neutral-900">{showWords[index] ? pair.word : masked(pair.word)}</p>
                <button type="button" onClick={() => setShowWords((s) => s.map((v, i) => (i === index ? !v : v)) as [boolean, boolean])}
                  className="mt-1 text-xs font-bold text-warning-700 hover:text-warning-800">
                  {showWords[index] ? "🙈 Ẩn" : "👁️ Hiện"}
                </button>
              </div>
              {/* Audio */}
              <div className="mb-4 flex justify-center"><AudioButton audioUrl={pair.audioUrl} label="🔊 Nghe mẫu" /></div>
              {/* Waveform container luôn render (để hook useEffect khởi tạo wavesurfer lúc mount).
                  Ẩn CSS khi không recording để không chiếm chỗ. */}
              <div
                ref={recorder.containerRef}
                className={`mb-4 rounded-lg bg-neutral-50 p-2 transition-all ${
                  statuses[index] === "recording" ? "opacity-100" : "h-0 overflow-hidden opacity-0 py-0"
                }`}
              />
              {/* Hint text khi cột này đang recording */}
              {statuses[index] === "recording" && (
                <p className={`mb-3 text-center text-sm font-bold ${hintText(recorder.level).color}`}>
                  {hintText(recorder.level).text}
                </p>
              )}
              {/* Nút thu / trạng thái thu */}
              <button type="button" onClick={() => startRecording(index)} disabled={statuses[index] === "recording"}
                className={`w-full rounded-xl border-2 px-6 py-4 font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:cursor-wait disabled:opacity-70 ${
                  statuses[index] === "recorded" ? "border-success-500 bg-success-500 text-white hover:bg-success-600"
                  : statuses[index] === "recording" ? "animate-pulse border-error-500 bg-error-500 text-white"
                  : "border-warning-300 bg-warning-100 text-warning-800 hover:border-warning-500 hover:bg-warning-200"}`}>
                {statuses[index] === "recording" ? "🎤 Đang nghe..." : statuses[index] === "recorded" ? "✓ Đã ghi" : "🎤 Bấm để nói"}
              </button>
              {/* Nút Ghi lại khi đã ghi (retake trước khi kiểm tra) */}
              {statuses[index] === "recorded" && (
                <button type="button" onClick={() => startRecording(index)}
                  className="mt-2 w-full rounded-lg border-2 border-warning-300 bg-white px-4 py-2 text-sm font-bold text-warning-700 transition-colors hover:bg-warning-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-300">
                  🎤 Ghi lại
                </button>
              )}
            </div>
            );
          })}
        </div>

        {/* Check button / results */}
        {overallStatus === "idle" || overallStatus === "processing" ? (
          <button type="button" onClick={checkBothAnswers} disabled={!canCheck || overallStatus === "processing"}
            className="w-full rounded-xl border-2 border-warning-500 bg-warning-500 px-8 py-5 text-xl font-black uppercase tracking-widest text-white transition-all hover:bg-warning-600 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-300 disabled:cursor-not-allowed disabled:opacity-50">
            {overallStatus === "processing" ? "⏳ Đang kiểm tra..." : canCheck ? "✓ Kiểm tra kết quả" : "✓ Kiểm tra"}
          </button>
        ) : (
          <SpeakFeedbackSheet
            isCorrect={overallStatus === "correct"}
            transcript={combinedTranscript}
            answerText={`${pairs[0].word} & ${pairs[1].word}`}
            retryLabel="Làm lại cả 2"
            audioReplay={
              <div className="flex flex-wrap items-center gap-2">
                <AudioButton audioUrl={pairs[0].audioUrl} label={`🔊 ${pairs[0].word}`} />
                <AudioButton audioUrl={pairs[1].audioUrl} label={`🔊 ${pairs[1].word}`} />
              </div>
            }
            onRetry={() => {
              setOverallStatus("idle");
              setStatuses(["idle", "idle"]);
              setTranscripts(["", ""]);
              recorder0.reset();
              recorder1.reset();
            }}
            onNext={() => onNext(overallStatus === "correct", combinedTranscript)}
          />
        )}
      </div>
    </div>
  );
}
