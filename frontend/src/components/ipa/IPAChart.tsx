"use client";

import React, { useState } from "react";
import { Phoneme, IPA_DATA } from "@/lib/mockData";
import RecordButton from "@/components/audio/RecordButton";

export default function IPAChart() {
  const [selectedPhoneme, setSelectedPhoneme] = useState<Phoneme | null>(null);

  const vowels = IPA_DATA.filter((p) => p.type === "vowel");
  const consonants = IPA_DATA.filter((p) => p.type === "consonant");

  const handlePlaySound = (phoneme: Phoneme) => {
    // Mở modal luyện tập cho âm vị này
    setSelectedPhoneme(phoneme);
    console.log(`Selected phoneme: ${phoneme.symbol}`);
  };

  const renderGrid = (items: Phoneme[], bgColor: string, hoverColor: string) => (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {items.map((phoneme) => (
        <button
          key={phoneme.symbol}
          onClick={() => handlePlaySound(phoneme)}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-200 
            ${bgColor} ${hoverColor} transition-all duration-200 shadow-sm
            focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-opacity-50
            ${selectedPhoneme?.symbol === phoneme.symbol ? 'ring-2 ring-primary-600' : ''}`}
          aria-label={`Luyện tập âm vị ${phoneme.symbol}, ví dụ từ ${phoneme.example}`}
          title={phoneme.name}
        >
          <span className="text-2xl font-bold font-ipa text-neutral-800">
            {phoneme.symbol}
          </span>
          <span className="text-sm text-neutral-600 mt-1">
            {phoneme.example}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Bảng IPA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
          Bảng Ký Hiệu Ngữ Âm Quốc Tế (IPA)
        </h2>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-primary-700 mb-4 flex items-center">
            <span className="w-3 h-3 rounded-full bg-primary-100 border border-primary-500 mr-2"></span>
            Nguyên âm (Vowels)
          </h3>
          {renderGrid(vowels, "bg-primary-50", "hover:bg-primary-100 hover:border-primary-300")}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-success-700 mb-4 flex items-center">
            <span className="w-3 h-3 rounded-full bg-success-50 border border-success-500 mr-2"></span>
            Phụ âm (Consonants)
          </h3>
          {renderGrid(consonants, "bg-success-50", "hover:bg-success-100 hover:border-success-300")}
        </div>
      </div>

      {/* Khu vực Luyện Tập (Practice Modal / Section) */}
      {selectedPhoneme && (
        <div 
          className="bg-white p-8 rounded-xl shadow-md border-2 border-primary-100 scroll-mt-24"
          id="practice-section"
          aria-live="polite"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900">
                Luyện tập âm vị <span className="font-ipa text-primary-600">/{selectedPhoneme.symbol}/</span>
              </h3>
              <p className="text-neutral-600 mt-1">{selectedPhoneme.name}</p>
            </div>
            <button 
              onClick={() => setSelectedPhoneme(null)}
              className="text-neutral-400 hover:text-neutral-600 p-2 rounded-md hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none"
              aria-label="Đóng khu vực luyện tập"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-lg border border-primary-100">
              <span className="text-sm text-primary-700 font-semibold mb-2">ĐỌC THEO TỪ MẪU</span>
              <span className="text-5xl font-bold text-neutral-900 mb-2">{selectedPhoneme.example}</span>
              <button className="mt-4 flex items-center px-4 py-2 bg-white text-primary-600 rounded-md border border-primary-200 hover:bg-primary-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus:outline-none shadow-sm">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.899a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                Nghe mẫu
              </button>
            </div>

            <div className="flex flex-col items-center justify-center border-l-0 md:border-l border-t md:border-t-0 border-neutral-200 pt-6 md:pt-0 pl-0 md:pl-8">
              <span className="text-sm text-neutral-500 font-semibold mb-2">TỚI LƯỢT BẠN</span>
              <RecordButton expectedAnswer={selectedPhoneme.example} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
