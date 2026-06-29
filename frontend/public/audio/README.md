# Audio Files cho Âm Vị IPA

Thư mục này chứa file audio mẫu cho 44 âm vị tiếng Anh.

## Cấu trúc

```
audio/
├── phonemes/          # Audio cho từng âm vị IPA
│   ├── vowels/
│   │   ├── i.mp3     # /iː/ - see
│   │   ├── I.mp3     # /ɪ/ - sit
│   │   ├── e.mp3     # /e/ - bed
│   │   ├── ae.mp3    # /æ/ - cat
│   │   └── ...
│   └── consonants/
│       ├── p.mp3     # /p/ - pen
│       ├── b.mp3     # /b/ - big
│       └── ...
├── words/             # Audio cho từ mẫu
│   ├── cat.mp3
│   ├── dog.mp3
│   └── ...
└── sentences/         # Audio cho câu mẫu
    ├── sentence1.mp3
    └── ...
```

## Nguồn Audio

### Option 1: Tự ghi âm
- Sử dụng microphone chất lượng tốt
- Ghi âm trong môi trường yên tĩnh
- Format: MP3, 128kbps, 44.1kHz

### Option 2: Sử dụng TTS (Text-to-Speech)
- Google Cloud Text-to-Speech API
- Amazon Polly
- Microsoft Azure Speech

### Option 3: Tải từ nguồn miễn phí
- Forvo.com (cần attribution)
- YouGlish.com
- Cambridge Dictionary

## Fallback: Web Speech Synthesis API

Nếu không có file audio, hệ thống sẽ tự động sử dụng Web Speech Synthesis API (TTS) của trình duyệt.

```typescript
const utterance = new SpeechSynthesisUtterance("cat");
utterance.lang = 'en-US';
utterance.rate = 0.8; // Nói chậm hơn
window.speechSynthesis.speak(utterance);
```

## Naming Convention

- Tên file: lowercase, không dấu, không khoảng trắng
- Ví dụ: `ae.mp3` cho âm /æ/
- Ví dụ: `th_voiceless.mp3` cho âm /θ/
- Ví dụ: `th_voiced.mp3` cho âm /ð/

## TODO

- [ ] Thu thập 44 file audio cho âm vị IPA
- [ ] Thu thập audio cho 100 từ phổ biến
- [ ] Thu thập audio cho 50 câu mẫu
- [ ] Optimize file size (< 100KB mỗi file)
- [ ] Test trên nhiều trình duyệt
