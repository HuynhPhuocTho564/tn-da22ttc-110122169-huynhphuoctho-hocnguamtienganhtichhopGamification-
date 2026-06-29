# 🏝️ IPA Archipelago — Visual Assets Checklist

## Tổng quan

| Loại | Số lượng | Nguồn | Trạng thái |
|------|---------|-------|-----------|
| SVG đảo (island shapes) | 4 | Tự vẽ SVG | ✅ Tạo sẵn bên dưới |
| SVG trang trí (decorations) | 12+ | Tự vẽ SVG | ✅ Tạo sẵn bên dưới |
| SVG illustration phức tạp | 8 | Tải free (link bên dưới) | ⬜ Cần tải |
| CSS animations | 7 keyframes | Tự viết | ✅ Đã có trong plan |
| SVG UI elements | 5 | Tự vẽ SVG | ✅ Tạo sẵn bên dưới |

---

## 📥 CẦN TẢI: Free SVG Illustrations

### Nguồn 1: Storyset (storyset.com) — KHUYẾN NGHỊ CHÍNH
**Style**: Flat illustration, customizable colors, SVG download
**License**: Free (attribution required)

Tải các illustration sau (search trên storyset.com):

| # | Search term | Dùng cho | File đặt tại |
|---|-------------|----------|-------------|
| 1 | "island" hoặc "tropical island" | Đảo Nguyên Âm (Vowels) | `illustrations/islands/vowels-island.svg` |
| 2 | "lighthouse" hoặc "ocean island" | Đảo Phụ Âm (Consonants) | `illustrations/islands/consonants-island.svg` |
| 3 | "mystical" hoặc "crystal" | Đảo Cặp Tối Thiểu (Minimal Pairs) | `illustrations/islands/pairs-island.svg` |
| 4 | "volcano" hoặc "mountain" | Đảo Trọng Âm (Stress) | `illustrations/islands/stress-island.svg` |
| 5 | "sailboat" hoặc "boat" | Thuyền chuyển đảo | `illustrations/elements/boat.svg` |
| 6 | "treasure chest" hoặc "gift box" | Rương báu | `illustrations/elements/treasure-chest.svg` |
| 7 | "character studying" | Avatar nhân vật | `illustrations/characters/student.svg` |
| 8 | "adventure map" hoặc "compass" | Header/background accent | `illustrations/ui/compass.svg` |

### Nguồn 2: SVGRepo (svgrepo.com) — Icons & Simple SVGs
**License**: Most are MIT/Public Domain (no attribution)

| # | Search term | Dùng cho | File đặt tại |
|---|-------------|----------|-------------|
| 9 | "palm tree" | Trang trí đảo Vowels | `illustrations/elements/palm-tree.svg` |
| 10 | "tent" hoặc "camp" | Camp node icon | `illustrations/elements/tent.svg` |
| 11 | "flag" | Completed camp marker | `illustrations/elements/flag.svg` |
| 12 | "anchor" | Nautical decorations | `illustrations/elements/anchor.svg` |

### Nguồn 3: unDraw (undraw.co) — Nếu cần illustration lớn hơn
**License**: Free, no attribution required

| # | Search term | Dùng cho |
|---|-------------|----------|
| 13 | "adventure" | Empty state / onboarding |
| 14 | "exploring" | Loading / placeholder |

---

## ✅ ĐÃ TẠO SẴN: Self-drawn SVGs

Các SVG bên dưới được tạo sẵn trong thư mục `public/illustrations/`.
Đây là SVG đơn giản (geometric shapes) — đủ dùng cho MVP.
Có thể thay bằng illustration đẹp hơn từ Storyset sau.

### Đảo (fallback nếu chưa tải Storyset SVG):
- `islands/vowels-shape.svg` — Green blob island
- `islands/consonants-shape.svg` — Blue elongated island
- `islands/pairs-shape.svg` — Purple twin island
- `islands/stress-shape.svg` — Orange volcanic island

### Trang trí:
- `elements/wave-pattern.svg` — Animated wave decoration
- `elements/palm-tree-simple.svg` — Minimal palm tree
- `elements/lighthouse-simple.svg` — Minimal lighthouse
- `elements/crystal-simple.svg` — Minimal crystal
- `elements/volcano-simple.svg` — Minimal volcano
- `elements/cloud.svg` — Floating cloud
- `elements/star.svg` — Achievement star
- `elements/sand-texture.svg` — Beach sand pattern

### UI:
- `ui/progress-ring-bg.svg` — Background ring
- `ui/lock-icon.svg` — Lock for fog of war
- `ui/map-pin.svg` — Current position marker

---

## 🎨 Hướng dẫn tùy chỉnh Storyset SVG

Khi tải từ Storyset, bạn có thể **thay đổi màu** trực tiếp trên web:

| Đảo | Primary Color | Secondary Color |
|-----|---------------|-----------------|
| Vowels | #10b981 (emerald-500) | #d1fae5 (emerald-100) |
| Consonants | #3b82f6 (blue-500) | #dbeafe (blue-100) |
| Minimal Pairs | #a855f7 (purple-500) | #f3e8ff (purple-100) |
| Stress | #f97316 (orange-500) | #ffedd5 (orange-100) |

Sau khi tải SVG:
1. Mở file SVG trong text editor
2. Tìm `fill="..."` hoặc `style="fill:..."` 
3. Thay bằng Tailwind color tokens nếu muốn
4. Hoặc giữ nguyên — SVG sẽ render đúng màu

---

## 📁 Cấu trúc thư mục hoàn chỉnh

```
public/illustrations/
├── islands/
│   ├── vowels-island.svg          ← Tải từ Storyset (hoặc dùng vowels-shape.svg)
│   ├── vowels-shape.svg           ✅ Tự vẽ (fallback)
│   ├── consonants-island.svg      ← Tải từ Storyset
│   ├── consonants-shape.svg       ✅ Tự vẽ (fallback)
│   ├── pairs-island.svg           ← Tải từ Storyset
│   ├── pairs-shape.svg            ✅ Tự vẽ (fallback)
│   ├── stress-island.svg          ← Tải từ Storyset
│   └── stress-shape.svg           ✅ Tự vẽ (fallback)
├── elements/
│   ├── boat.svg                   ← Tải từ Storyset
│   ├── treasure-chest.svg         ← Tải từ Storyset
│   ├── palm-tree.svg              ← Tải từ SVGRepo
│   ├── tent.svg                   ← Tải từ SVGRepo
│   ├── flag.svg                   ← Tải từ SVGRepo
│   ├── anchor.svg                 ← Tải từ SVGRepo
│   ├── wave-pattern.svg           ✅ Tự vẽ
│   ├── palm-tree-simple.svg       ✅ Tự vẽ (fallback)
│   ├── lighthouse-simple.svg      ✅ Tự vẽ (fallback)
│   ├── crystal-simple.svg         ✅ Tự vẽ (fallback)
│   ├── volcano-simple.svg         ✅ Tự vẽ (fallback)
│   ├── cloud.svg                  ✅ Tự vẽ
│   ├── star.svg                   ✅ Tự vẽ
│   └── sand-texture.svg           ✅ Tự vẽ
├── characters/
│   ├── student.svg                ← Tải từ Storyset
│   └── student-simple.svg         ✅ Tự vẽ (fallback)
└── ui/
    ├── compass.svg                ← Tải từ Storyset (optional)
    ├── progress-ring-bg.svg       ✅ Tự vẽ
    ├── lock-icon.svg              ✅ Tự vẽ
    └── map-pin.svg                ✅ Tự vẽ
```

---

## ⚡ Quick Start (Không cần tải gì)

Nếu muốn chạy MVP ngay mà **không tải SVG nào**:
- Tất cả components sẽ dùng **fallback SVG tự vẽ** (hình geometric đơn giản)
- Thay vì illustration đảo → dùng blob shape + gradient
- Thay vì character → dùng emoji với CSS effects
- Thay vì boat → dùng CSS triangle + animation

Visual sẽ ở mức **"clean & minimal"** — đủ cho demo, có thể nâng cấp sau bằng Storyset SVGs.
