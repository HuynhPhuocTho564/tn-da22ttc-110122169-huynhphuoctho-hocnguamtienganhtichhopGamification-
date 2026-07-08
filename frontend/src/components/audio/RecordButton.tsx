"use client";

import React from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface RecordButtonProps {
  expectedAnswer: string;
}

export default function RecordButton({ expectedAnswer }: RecordButtonProps) {
  const {
    state,
    transcript,
    isCorrect,
    error,
    isSupported,
    startListening,
    reset
  } = useSpeechRecognition(expectedAnswer);

  if (!isSupported) {
    return (
      <div className="p-4 bg-error-50 text-error-500 rounded-md border border-error-500 text-sm" role="alert">
        {error}
      </div>
    );
  }

  // Determine button styles based on state (HCI guidelines for colors)
  let buttonClasses = "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ";
  let iconContent = null;
  
  switch (state) {
    case 'idle':
      buttonClasses += "bg-primary-500 hover:bg-primary-600 text-white focus-visible:ring-primary-500";
      iconContent = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      );
      break;
    case 'listening':
      // Red pulsing ring animation for recording state
      buttonClasses += "bg-error-500 text-white animate-pulse focus-visible:ring-error-500";
      iconContent = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
      );
      break;
    case 'processing':
      buttonClasses += "bg-warning-500 text-white cursor-not-allowed focus-visible:ring-warning-500";
      iconContent = (
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
      break;
    case 'result':
      buttonClasses += "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 focus-visible:ring-neutral-500";
      iconContent = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
      break;
  }

  // Aria live region text for screen readers (Accessibility skill)
  let statusText = "Nhấn để bắt đầu ghi âm";
  if (state === 'listening') statusText = "Đang nghe... hãy đọc từ cần luyện tập";
  if (state === 'processing') statusText = "Đang phân tích kết quả...";
  if (state === 'result') {
    statusText = isCorrect ? "Tuyệt vời, bạn đã phát âm đúng!" : "Rất tiếc, bạn phát âm chưa chính xác. Hãy thử lại.";
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      
      {/* Nút bấm (HCI: Touch target lớn, feedback rõ ràng) */}
      <button 
        onClick={state === 'result' ? reset : startListening}
        disabled={state === 'processing' || state === 'listening'}
        className={buttonClasses}
        aria-label={statusText}
        title={statusText}
      >
        {iconContent}
      </button>

      {/* Live Region cho Screen Reader */}
      <div aria-live="polite" className="sr-only">
        {statusText}
      </div>

      {/* Hiển thị văn bản (Accessibility / Visual Feedback) */}
      <div className="text-center min-h-[80px]">
        {state === 'listening' && (
          <p className="text-error-600 font-medium animate-pulse">Đang nghe...</p>
        )}
        {error && (
          <p className="text-error-500 text-sm mt-2">{error}</p>
        )}
        
        {/* Kết quả chấm điểm */}
        {state === 'result' && (
          <div className="mt-2 p-4 rounded-lg bg-white border border-neutral-200 shadow-sm">
            <p className="text-neutral-600 text-sm mb-2">Bạn vừa đọc:</p>
            <p className="text-xl font-medium mb-3">"{transcript || '...'}"</p>
            
            {isCorrect ? (
              <div className="flex items-center justify-center text-success-600 font-bold bg-success-50 py-2 px-4 rounded-md">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Xuất sắc! 🎉
              </div>
            ) : (
              <div className="flex items-center justify-center text-error-600 font-bold bg-error-50 py-2 px-4 rounded-md">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Cần luyện thêm 💪
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
