"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseWordPrompt, type ExerciseQuestion } from "./ExerciseEngineClient";
import { useWaveformRecorder, type RecorderLevel } from "@/hooks/useWaveformRecorder";
import { calculateWordOverlapAccuracy } from "@/lib/scoring";
import SpeakFeedbackSheet from "./SpeakFeedbackSheet";

type SpeakSentenceQuestionProps = {
  question: ExerciseQuestion;
  onNext: (correct: boolean, transcript: string) => void;
  unlockedSlowAudio?: boolean;
  unlockedIpaReveal?: boolean;
};

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

function playSentence(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) utter.voice = enVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

/** Play sentence at half speed (x0.5) - unlocked from shop */
function playSentenceSlow(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.5;
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) utter.voice = enVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function hintText(level: RecorderLevel): { text: string; color: string } {
  switch (level) {
    case "silence": return { text: "🗣️ Nói to hơn", color: "text-neutral-500" };
    case "normal": return { text: "✅ Âm lượng tốt", color: "text-success-600" };
    case "loud": return { text: "⚠️ Nói nhỏ lại", color: "text-warning-600" };
  }
}

export default function SpeakSentenceQuestion({ question, onNext, unlockedSlowAudio = false, unlockedIpaReveal = false }: SpeakSentenceQuestionProps) {
  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "correct" | "incorrect" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [showSentence, setShowSentence] = useState(false);
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useWaveformRecorder();

  useEffect(() => {
    setSpeechUnsupported(getSpeechCtor() === null);
    setStatus("idle"); setTranscript(""); setShowSentence(false); setMicDenied(false);
    recorder.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const words = question.answer.trim().split(/\s+/);
  const maskedSentence = words.map(() => "•".repeat(5)).join(" ");
  const hint = hintText(recorder.level);

  // DRY: dùng calculateWordOverlapAccuracy từ scoring.ts (giống engine VoiceQuestion cũ)
  // v2 Mode B multi-answer: max overlap across [answer, ...acceptedAnswers]
  const checkAnswer = (recordedText: string) => {
    setStatus("processing");
    recorder.stop();
    window.setTimeout(() => {
      const candidates =
        question.acceptedAnswers && question.acceptedAnswers.length > 0
          ? [question.answer, ...question.acceptedAnswers]
          : [question.answer];
      const acc = Math.max(...candidates.map((c) => calculateWordOverlapAccuracy(c, recordedText)));
      setStatus(acc >= 80 ? "correct" : "incorrect");
    }, 400);
  };

  const startRecording = () => {
    const Ctor = getSpeechCtor();
    if (!Ctor) { setSpeechUnsupported(true); setStatus("error"); return; }
    const recog = new Ctor();
    recog.continuous = false; recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onresult = (e) => { setTranscript(e.results[0][0].transcript); checkAnswer(e.results[0][0].transcript); };
    recog.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicDenied(true);
      }
      setStatus("error");
    };
    recog.onend = () => setStatus((cur) => (cur === "recording" ? "error" : cur));
    recognitionRef.current = recog;
    setStatus("recording"); setTranscript("");
    void recorder.start();
    try {
      recog.start();
      window.setTimeout(() => { try { recog.stop(); } catch { /* */ } }, 5000); // sentence: 5s
    } catch (e) { console.error("recognition start failed:", e); setStatus("error"); }
  };

  const stopRecording = () => { try { recognitionRef.current?.stop(); } catch { /**/ } recorder.stop(); };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border-2 border-accent-300 bg-gradient-to-br from-accent-50 to-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-accent-100 px-4 py-1.5 text-sm font-bold text-accent-700">🎯 Thực chiến</span>
        </div>

        {/* IPA transcription */}
        {contentData.ipa && (
          <div className="mb-4 text-center">
            <p className="font-ipa text-xl font-bold text-accent-500">{contentData.ipa}</p>
          </div>
        )}

        {/* Câu ẩn (toggle) */}
        <div className="mb-6 text-center">
          <p className="text-xl font-bold leading-relaxed text-neutral-900">
            {showSentence ? question.answer : maskedSentence}
          </p>
          <button type="button" onClick={() => setShowSentence((s) => !s)}
            className="mt-3 text-sm font-bold text-accent-600 hover:text-accent-700">
            {showSentence ? "🙈 Ẩn câu" : "👁️ Hiện câu"}
          </button>
        </div>

        {/* Audio speechSynthesis */}
        <div className="mb-6 flex justify-center gap-3">
          <button type="button" onClick={() => playSentence(question.answer)} aria-label="Nghe mẫu câu"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-500">
            🎧 Nghe mẫu câu
          </button>
          {/* Slow audio x0.5 - only when unlocked from shop */}
          {unlockedSlowAudio && (
            <button type="button" onClick={() => playSentenceSlow(question.answer)} aria-label="Nghe chậm x0.5"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-300 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-700 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-400">
              🐢 Nghe chậm x0.5
            </button>
          )}
        </div>

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
                ⚠️ Trình duyệt chưa hỗ trợ Web Speech API. Hãy dùng Chrome/Edge.
              </div>
            )}
            <button type="button" onClick={startRecording}
              className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-300">
              <span className="text-5xl" role="img" aria-label="microphone">🎤</span>
            </button>
            <p className="text-sm font-bold text-neutral-500">Đọc câu hoàn chỉnh</p>
          </div>
        )}

        {status === "recording" && (
          <div className="mt-4 space-y-3 text-center">
            <p className={`text-sm font-bold ${hint.color}`}>{hint.text}</p>
            <button type="button" onClick={stopRecording}
              className="rounded-xl bg-neutral-200 px-8 py-3 font-bold text-neutral-700 hover:bg-neutral-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-400">
              Dừng ghi âm
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="mt-4 space-y-3 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" />
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
                className="rounded-xl bg-accent-600 px-6 py-3 font-bold text-white hover:bg-accent-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-300">
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
            audioReplay={
              <button
                type="button"
                onClick={() => playSentence(question.answer)}
                aria-label="Nghe lại câu mẫu"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-500"
              >
                🎧 Nghe lại câu mẫu
              </button>
            }
            onRetry={startRecording}
            onNext={() => onNext(status === "correct", transcript)}
          />
        )}
      </div>
    </div>
  );
}
