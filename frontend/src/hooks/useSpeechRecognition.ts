"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Minimal type definitions for Web Speech API.
 * TypeScript DOM lib doesn't include SpeechRecognition types by default.
 * maintainable-code: Type Safety (E) — no `any`.
 */
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type SpeechState = 'idle' | 'listening' | 'processing' | 'result';

export function useSpeechRecognition(expectedAnswer: string) {
  const [state, setState] = useState<SpeechState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  /** Ref luôn phản ánh state mới nhất — tránh stale closure trong event handler */
  const stateRef = useRef<SpeechState>(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Khởi tạo SpeechRecognition instance (Memoize để tránh tạo lại liên tục)
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    // Kiểm tra hỗ trợ trình duyệt (Chủ yếu Chrome/Edge hỗ trợ tốt)
    if (typeof window !== 'undefined') {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionCtor) {
        setIsSupported(false);
        setError("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói. Vui lòng sử dụng Google Chrome hoặc Microsoft Edge.");
      } else {
        const recog = new SpeechRecognitionCtor();
        recog.lang = 'en-US';
        recog.continuous = false; // Chỉ lấy 1 kết quả rồi dừng
        recog.interimResults = false;
        recog.maxAlternatives = 1;
        setRecognition(recog);
      }
    }
  }, []);

  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z\s]/g, ""); // Bỏ dấu câu, chỉ giữ lại chữ cái a-z và khoảng trắng
  };

  const startListening = useCallback(() => {
    if (!recognition) return;
    
    setError(null);
    setTranscript('');
    setIsCorrect(null);
    setState('listening');

    recognition.start();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setState('processing');
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      
      // So khớp chuỗi
      const normalizedTranscript = normalize(currentTranscript);
      const normalizedExpected = normalize(expectedAnswer);
      
      const correct = normalizedTranscript === normalizedExpected || normalizedTranscript.includes(normalizedExpected);
      setIsCorrect(correct);
      setState('result');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState('idle');
      setError(`Lỗi nhận diện giọng nói: ${event.error}`);
    };

    recognition.onend = () => {
      if (stateRef.current === 'listening') {
        setState('idle');
      }
    };
  }, [recognition, expectedAnswer]);

  const stopListening = useCallback(() => {
    if (recognition && stateRef.current === 'listening') {
      recognition.stop();
      setState('idle');
    }
  }, [recognition]);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setIsCorrect(null);
    setError(null);
  }, []);

  return {
    state,
    transcript,
    isCorrect,
    error,
    isSupported,
    startListening,
    stopListening,
    reset
  };
}
