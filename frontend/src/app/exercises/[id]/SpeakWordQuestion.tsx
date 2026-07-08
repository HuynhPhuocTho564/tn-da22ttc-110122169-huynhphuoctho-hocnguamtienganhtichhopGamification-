"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseWordPrompt, type ExerciseQuestion } from "./ExerciseEngineClient";
import { useWaveformRecorder, type RecorderLevel } from "@/hooks/useWaveformRecorder";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { RECORDING_LIMIT_SECONDS } from "@/lib/gamification/constants";
import { calculateWordOverlapAccuracy } from "@/lib/scoring";
import IpaPopup from "@/components/ui/IpaPopup";
import SpeakFeedbackSheet from "./SpeakFeedbackSheet";

type SpeakWordQuestionProps = {
  question: ExerciseQuestion;
  onNext: (correct: boolean, transcript: string) => void;
  unlockedSlowAudio?: boolean;
};

// SpeechRecognition types (giống engine)
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

// Nút audio (inline, pattern MiniSpeaker/ReplayButton)
function AudioButton({ audioUrl, label }: { audioUrl?: string; label: string }) {
  if (!audioUrl) return null;
  const play = () => {
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.warn("audio failed:", e));
  };
  return (
    <button type="button" onClick={play} aria-label={label}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500">
      {label}
    </button>
  );
}

// Hint text theo level (dynamic feedback)
function hintText(level: RecorderLevel): { text: string; color: string } {
  switch (level) {
    case "silence": return { text: "🗣️ Nói to hơn", color: "text-neutral-500" };
    case "normal": return { text: "✅ Âm lượng tốt", color: "text-success-600" };
    case "loud": return { text: "⚠️ Nói nhỏ lại", color: "text-warning-600" };
  }
}

export default function SpeakWordQuestion({ question, onNext, unlockedSlowAudio = false }: SpeakWordQuestionProps) {
  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "correct" | "incorrect" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [showWord, setShowWord] = useState(false);
  const [, setRetryCount] = useState(0);
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useWaveformRecorder();
  // Task 5.2: countdown khi recording — user biết còn bao nhiêu giây (H1)
  const countdown = useCountdown(RECORDING_LIMIT_SECONDS, status === "recording");

  useEffect(() => {
    setSpeechUnsupported(getSpeechCtor() === null);
    setStatus("idle"); setTranscript(""); setRetryCount(0); setShowWord(false); setMicDenied(false);
    recorder.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const displayWord = contentData.word ? contentData.word.charAt(0).toUpperCase() + contentData.word.slice(1) : question.answer;
  const maskedWord = "•".repeat(Math.max(contentData.word?.length ?? question.answer.length, 3));
  const hint = hintText(recorder.level);

  const checkAnswer = (recordedText: string) => {
    setStatus("processing");
    recorder.stop();
    window.setTimeout(() => {
      // v2: Use WER-based scoring (same as server) for partial credit
      const candidates =
        question.acceptedAnswers && question.acceptedAnswers.length > 0
          ? [question.answer, ...question.acceptedAnswers]
          : [question.answer];
      const acc = Math.max(...candidates.map((c) => calculateWordOverlapAccuracy(c, recordedText)));
      if (acc >= 80) setStatus("correct");
      else { setStatus("incorrect"); setRetryCount((c) => c + 1); }
    }, 400);
  };

  const startRecording = () => {
    const Ctor = getSpeechCtor();
    if (!Ctor) { setSpeechUnsupported(true); setStatus("error"); return; }
    const recog = new Ctor();
    recog.continuous = false; recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onresult = (e) => { setTranscript(e.results[0][0].transcript); checkAnswer(e.results[0][0].transcript); };
    recog.onerror = (e) => {
      // Phân biệt error type: mic-denied vs no-speech vs other
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicDenied(true);
        setStatus("error");
      } else {
        setStatus("error");
      }
    };
    recog.onend = () => setStatus((cur) => (cur === "recording" ? "error" : cur));
    recognitionRef.current = recog;
    setStatus("recording"); setTranscript("");
    void recorder.start();
    try {
      recog.start();
      window.setTimeout(() => { try { recog.stop(); } catch { /* already stopped */ } }, RECORDING_LIMIT_SECONDS * 1000);
    } catch (e) { console.error("recognition start failed:", e); setStatus("error"); }
  };

  const stopRecording = () => { try { recognitionRef.current?.stop(); } catch { /* */ } recorder.stop(); };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border-2 border-success-300 bg-gradient-to-br from-white to-neutral-50 p-8 shadow-lg">
        {/* Badge */}
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-success-100 px-4 py-1.5 text-sm font-bold text-success-700">🗣️ Luyện miệng</span>
        </div>

        {/* Tầng 1: IPA trên (hiện luôn) — Task 5.3: clickable → popup hint */}
        {contentData.ipa && (
          <p className="mb-4 text-center">
            <IpaPopup
              ipa={contentData.ipa}
              targetPhoneme={contentData.targetPhoneme}
              className="text-5xl font-bold text-primary-600"
            />
          </p>
        )}

        {/* Tầng 2: Từ ẩn dưới IPA */}
        <div className="mb-6 text-center">
          <p className="text-3xl font-black tracking-tight text-neutral-900">
            {showWord ? displayWord : maskedWord}
          </p>
          <button type="button" onClick={() => setShowWord((s) => !s)}
            className="mt-2 text-sm font-bold text-primary-600 hover:text-primary-700">
            {showWord ? "🙈 Ẩn từ" : "👁️ Hiện từ"}
          </button>
        </div>

        {/* Tầng 3: Audio phát */}
        <div className="mb-6 flex justify-center gap-3">
          <AudioButton audioUrl={contentData.audioUrl} label="🔊 Nghe mẫu" />
          {unlockedSlowAudio && contentData.audioUrl && (
            <button type="button" onClick={() => {
              const audio = new Audio(contentData.audioUrl);
              audio.playbackRate = 0.5;
              audio.play().catch((e) => console.warn("slow audio failed:", e));
            }} aria-label="Nghe chậm x0.5"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-300 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-700 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-400">
              🐢 Nghe chậm x0.5
            </button>
          )}
        </div>

        {/* Tầng 4: Mic + waveform + hint */}
        {/* Waveform container luôn render (để hook useEffect khởi tạo wavesurfer lúc mount).
            Ẩn CSS khi không recording/processing để không chiếm chỗ. */}
        <div
          ref={recorder.containerRef}
          className={`rounded-lg bg-neutral-50 p-2 transition-all ${
            status === "recording" || status === "processing" ? "opacity-100" : "h-0 overflow-hidden opacity-0 py-0"
          }`}
        />

        {status === "idle" && (
          <div className="mt-6 space-y-4 text-center">
            {speechUnsupported && (
              <div className="rounded-xl border-2 border-warning-300 bg-warning-50 p-4 text-sm font-semibold text-warning-800" role="alert">
                ⚠️ Trình duyệt chưa hỗ trợ Web Speech API. Hãy dùng Chrome hoặc Edge.
              </div>
            )}
            <button type="button" onClick={startRecording}
              className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-error-500 to-error-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-error-300">
              <span className="text-5xl" role="img" aria-label="microphone">🎤</span>
            </button>
            <p className="text-sm font-bold text-neutral-500">Nhấn để bắt đầu ghi âm</p>
          </div>
        )}

        {status === "recording" && (
          <div className="mt-4 space-y-4 text-center">
            <p className={`text-sm font-bold ${hint.color}`}>{hint.text}</p>

            {/* Task 5.2: Countdown circle — user biết còn bao nhiêu giây (H1).
                SVG circle: strokeDasharray giảm theo remaining.
                Amber khi >2s, error khi ≤2s (gần hết giờ). */}
            <div className="relative mx-auto h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={countdown <= 2 ? "#ef4444" : "#f59e0b"}
                  strokeWidth="6"
                  strokeDasharray={`${(countdown / RECORDING_LIMIT_SECONDS) * 264} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-3xl font-black ${countdown <= 2 ? "text-error-600" : "text-warning-600"}`}
                  aria-label={`Còn ${countdown} giây`}
                >
                  {countdown}
                </span>
              </div>
            </div>

            <button type="button" onClick={stopRecording}
              className="rounded-xl bg-neutral-200 px-8 py-3 font-bold text-neutral-700 transition-colors hover:bg-neutral-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-400">
              Dừng ghi âm
            </button>
          </div>
        )}

        {status === "processing" && (
          <div
            className="mt-4 space-y-3 text-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm font-semibold text-neutral-600">Đang phân tích giọng nói...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">😕</div>
            <div className="rounded-xl border-2 border-warning-300 bg-warning-50 p-4 text-warning-800">
              <p className="font-bold">
                {speechUnsupported ? "Trình duyệt không hỗ trợ"
                  : micDenied ? "🔒 Microphone bị chặn"
                  : "Không nghe thấy giọng nói"}
              </p>
              <p className="mt-1 text-sm">
                {speechUnsupported ? "Hãy dùng Chrome/Edge"
                  : micDenied ? "Cấp quyền microphone trong browser: click icon 🔒 bên trái thanh địa chỉ → Site settings → Microphone → Allow, rồi reload trang"
                  : "Kiểm tra microphone và thử lại — nói to, rõ, bằng tiếng Anh"}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={startRecording}
                className="rounded-xl bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
                Thử lại
              </button>
              <button type="button" onClick={() => onNext(false, "")}
                className="rounded-xl bg-neutral-200 px-6 py-3 font-bold text-neutral-700 hover:bg-neutral-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-400">
                Bỏ qua →
              </button>
            </div>
          </div>
        )}

        {(status === "correct" || status === "incorrect") && (
          <SpeakFeedbackSheet
            isCorrect={status === "correct"}
            transcript={transcript}
            answerText={question.answer}
            ipa={contentData.ipa}
            audioReplay={<AudioButton audioUrl={contentData.audioUrl} label="🔊 Nghe lại mẫu" />}
            onRetry={startRecording}
            onNext={() => onNext(status === "correct", transcript)}
          />
        )}
      </div>
    </div>
  );
}
