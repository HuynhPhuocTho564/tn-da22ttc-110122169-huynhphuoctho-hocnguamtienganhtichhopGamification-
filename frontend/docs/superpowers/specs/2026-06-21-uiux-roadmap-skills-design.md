# Design: 4 Skill phục vụ UI/UX Improvement Roadmap

**Ngày:** 2026-06-21
**Tác giả:** Brainstorming session (PhuocTho + ZCode)
**Liên quan:** `PLAN/03_UI_UX/IMPROVEMENT_P1..P6`, `PLAN/05_AI_Skills/AI_SKILLS_INVENTORY.md`

---

## 1. Mục tiêu

Tạo 4 skill nội bộ để AI dùng khi thực hiện 27 task trong `PLAN/03_UI_UX/IMPROVEMENT_P1_QUICK_WINS.md` → `IMPROVEMENT_P6_SOCIAL_RETENTION.md`. Các file PLAN đã tham chiếu đúng tên 4 skill này (xem `IMPROVEMENT_ROADMAP_INDEX.md` bảng "Skills Áp Dụng Cho Mọi Tasks"), nên cần tạo skill với tên khớp để tham chiếu không gãy.

4 skill:
1. `maintainable-code` — Mọi thay đổi code
2. `nielsen-ux-heuristics` — Thiết kế/review UX
3. `ui-color-harmony` — Thay đổi màu, theme, Rank Tier
4. `web-usability-scales` — Đánh giá UX before/after, kết thúc sprint

---

## 2. Bối cảnh phát hiện

Dự án đã có 14 skill tại `english_pronunciation_app/.agents/skills/`. 3/4 skill mới có trùng lặp đáng kể:

| Skill mới | Skill đã có trùng | Mức trùng |
|---|---|---|
| maintainable-code | architect-mode | ~85% (architect-mode rộng hơn) |
| nielsen-ux-heuristics | hci_consultant | ~70% |
| ui-color-harmony | accessibility + hci_consultant | ~40% |
| web-usability-scales | (không có) | 0% — hoàn toàn mới |

**Quyết định đã chốt với user:** Vẫn tạo 4 skill mới nguyên bản đầy đủ (khớp đúng tên trong PLAN, AI không cần nhớ tên thay thế). Skill mới bổ sung song song, không sửa 14 skill gốc.

---

## 3. Quyết định thiết kế

### 3.1 Vị trí
```
english_pronunciation_app/.agents/skills/
├── SKILL/                                      ← nhóm 4 skill mới (UI/UX roadmap)
│   ├── maintainable-code/SKILL.md
│   ├── nielsen-ux-heuristics/SKILL.md
│   ├── ui-color-harmony/SKILL.md
│   └── web-usability-scales/SKILL.md
├── architect-mode/                             (14 skill gốc giữ nguyên)
├── hci_consultant/
└── ...
```
Lý do: cùng thư mục với 14 skill gốc → AI đọc một chỗ, đồng bộ với `AI_SKILLS_INVENTORY.md`. Subfolder `SKILL/` gom nhóm riêng để phân biệt rõ "skill phục vụ UI/UX roadmap" khỏi skill nền tảng.

### 3.2 Template cấu trúc (áp dụng cả 4)
```
---
name: <tên-skill>
description: <câu "Use when..." rõ ràng để AI biết trigger>
---

# <Tên skill hiển thị>

## Khi nào dùng
<2-4 câu: trigger cụ thể>

## Checklist thực thi
<Checklist [ ] — khớp IMPROVEMENT_ROADMAP_INDEX>

## Lý thuyết cốt lõi
<ĐẦY ĐỦ: định nghĩa → nguyên lý → giới hạn → ngoại lệ. Giải thích WHY>

## Ví dụ before/after (từ PLAN IMPROVEMENT)
<Ví dụ cụ thể từ task thật trong IMPROVEMENT_P1..P6>

## Quan hệ với skill khác
<1-2 câu: bổ sung/khác gì so với skill gốc có sẵn>
```

Ngôn ngữ: **Việt Nam chính + thuật ngữ kỹ thuật tiếng Anh** (khớp style `IMPROVEMENT_P*.md`).

### 3.3 Nguyên tắc Pareto cho nội dung
Mỗi skill phải nắm ~90% "20% cốt lõi quyết định 80% giá trị lý thuyết". Đã self-audit và bổ sung khoảng trống (xem mục 4).

---

## 4. Nội dung từng skill (đã bổ sung đủ cốt lõi)

### 4.1 `maintainable-code/SKILL.md`

**Trigger:** Mọi thay đổi code (component, service, route, seed, test). Bắt buộc đọc trước khi viết/sửa file.

**Checklist:** Không magic numbers · Types đầy đủ không `any` · Functions ≤ 50 dòng, components ≤ 200 dòng · Unit test cho pure function mới · `tsc --noEmit` pass

**Lý thuyết cốt lõi (đầy đủ):**

A. **Cohesion & Coupling** (Larry Constantine — gốc của maintainability)
- Cohesion cao: mọi phần trong module phục vụ 1 mục đích. Functional > Sequential > Communicational > Procedural > Temporal > Logical > Coincidental
- Coupling thấp: module phụ thuộc ít vào module khác. Data coupling > Stamp > Control > External > Common > Content
- Heuristic: "Nếu đổi 1 yêu cầu mà phải sửa 3+ file → coupling cao, cần refactor"
- Khác architect-mode: architect-mode nói *layering*, skill này nói *chất lượng bên trong 1 module*

B. **Naming** (intention-revealing — 80% maintainability đến từ đây)
- Tên mô tả WHAT + WHY, không mô tả HOW
- Tránh `data`, `info`, `temp`, `handle`, `process`, `manager` — quá chung
- Đặt tên theo ý nghĩa nghiệp vụ: `calculateRankingDelta()` không `processScore()`
- Boolean `is/has/can/should`; hàm trả về giá trị là danh từ; hàm side-effect là động từ
- Rule: "Nếu phải đọc thân hàm mới hiểu tên → tên sai"

C. **KISS — rule of three**
- 1 lần similar: giữ nguyên. 2 lần: chấp nhận, ghi nhận. 3 lần: extract
- Tránh premature abstraction: trừu tượng hóa sai tốn hơn duplication
- Khi nào ngoại lệ: prototype, demo, deadline gấp

D. **DRY — trùng lặp thật vs tình cờ**
- Trùng thật: cùng intent + cùng logic → extract
- Trùng tình cờ: cùng code nhưng intent khác → giữ tách biệt (violation ngược: "wrong DRY")
- Kỹ thuật extract: function (logic) → hook (state+logic) → utility module (cross-cutting)
- Kiểm tra: "Nếu sửa 1 chỗ, chỗ kia CŨNG phải sửa cùng cách → trùng thật"

E. **Type Safety**
- Cấm `any` — dùng `unknown` + type guard (typeof, in, instanceof, zod)
- Explicit return type cho hàm public/exported
- `Prisma.<Model>GetPayload<{ select: {...} }>` cho query result
- Interface PascalCase, type alias cho union, const UPPER_SNAKE_CASE
- Tại sao cấm any: `any` tắt type-checker → bug chạy được → lỗi khi runtime

F. **Constants**
- Magic number/string = giá trị literal không tự giải thích (`5`, `0.8`, `"weekly"`)
- Bắt buộc constant: threshold (70/80/90), multiplier (0.5/0.8), config (URL, key), enum-like string
- UPPER_SNAKE_CASE, group trong `src/lib/constants.ts` hoặc file domain (`gamification/constants.ts`)
- Khi nào tách file riêng: khi >20 constant hoặc theo domain riêng

G. **Boy Scout Rule** (Uncle Bob)
- "Leave the code cleaner than you found it"
- Mỗi lần sửa file: sửa 1 việc nhỏ phụ (đổi tên biến xấu, xóa import không dùng, tách hàm dài)
- Giới hạn: không refactor ngoài scope task hiện tại (tránh scope creep)

H. **SLAP** (Single Level of Abstraction)
- Mỗi hàm chỉ 1 mức trừu tượng. Không trộn `validate()` với `if (x > 5)`
- Hàm cao gọi hàm thấp, không lẫn lộn
- Lợi: đọc hàm top-down, hiểu flow mà không cần chi tiết

I. **Composition over inheritance**
- Ưu tiên compose small objects/functions thay vì class extends sâu
- Inheritance > 2 tầng → khó hiểu, fragile base class

J. **Giới hạn kích thước**
- Functions ≤ 50 dòng, components ≤ 200 dòng
- Lý do: cognitive load, con người giữ 7±2 ý (Miller); hàm dài quá 7±2 khối logic
- Ngoại lệ được phép: switch-case nhiều branch, generated code

K. **Testability**
- Pure function (no side effect) → unit test dễ
- Side effect (DB, network, time) → inject dependency, mock Prisma
- Test hành vi, không test implementation

**Ví dụ từ PLAN:**
- `DAILY_REWARD_GEMS` constant (P1-1.1) — thay hardcode 5/8/10
- `localizeBadgeType()` thay inline switch 3 chỗ (P1-1.3) — DRY
- Skeleton pattern nhất quán giữa badges/leaderboard page (P1-1.4) — DRY + consistency
- `normalize()` shared utility (architect-mode) — DRY cross-cutting

**Quan hệ:** Complement `architect-mode` (layering/dependency direction). Architect-mode nói *kiến trúc giữa các layer*, skill này nói *chất lượng code bên trong 1 file*. Dùng song song: architect-mode trước → maintainable-code trong từng file.

---

### 4.2 `nielsen-ux-heuristics/SKILL.md`

**Trigger:** Thiết kế UI mới, review UX trước/sau thay đổi, đánh giá heuristic, làm task trong IMPROVEMENT_P1..P6.

**Checklist:** H1 Visibility · H2 Match real world · H3 User control · H4 Consistency · H5 Error prevention · H6 Recognition over recall · H7 Flexibility · H8 Aesthetic/Minimalist · H9 Error recovery · H10 Help/docs (+ Cognitive Load, Fitts, Hick khi review đầy đủ)

**Lý thuyết cốt lõi (đầy đủ):**

A. **Cả 10 Nielsen heuristics** — mỗi cái: định nghĩa + vi phạm + đúng (gắn persona "Minh" — sinh viên Việt ESL beginner, từ hci_consultant)
1. H1 Visibility of system status — user biết đang xảy ra gì (loading skeleton, progress bar, toast)
2. H2 Match between system and real world — dùng ngôn ngữ user, không jargon. "Mọi thời đại" không "Tất thời gian" (P1-1.3.1)
3. H3 User control and freedom — undo, cancel, back. "Try again" sau phát âm sai
4. H4 Consistency and standards — cùng ý nghĩa → cùng UI. Currency thống nhất (P1-1.1)
5. H5 Error prevention — confirm trước destructive. Confirm exit exercise (P2-2.5)
6. H6 Recognition over recall — hiển thị option, không bắt user nhớ
7. H7 Flexibility and efficiency — shortcut cho user chuyên, default cho newbie
8. H8 Aesthetic and minimalist — chỉ giữ info phục vụ task. Cắt badge "Đồ án tốt nghiệp" (P1-1.3.2), bỏ animate-bounce (P1-1.1.3)
9. H9 Help users recognize/recover errors — câu lỗi rõ "Sai ở /ʃ/ vì...", không "Error"
10. H10 Help and documentation — onboarding tour (P2-2.3), tooltip, help page

B. **Cognitive Load Theory** (Sweller)
- Intrinsic: khó vốn có của bài học (IPA /ʃ/ vs /s/) → giảm bằng chunking, sắp thứ tự
- Extraneous: khó do design kém (clutter, layout rối) → CẮT. Sidebar quá nhiều widget (P2-2.1)
- Germane: khó tốt → schema building. Gamification, phản hồi cụ thể
- Miller 7±2: ≤7 item mỗi session/group. Progressive disclosure: ẩn advance đến khi cần

C. **Fitts's Law** — MT = a + b·log₂(2D/W)
- D = khoảng cách, W = kích thước target
- Hệ quả: target thường dùng → to + gần; target nguy hiểm → nhỏ + xa
- Touch target ≥44px (desktop WCAG), ≥48px (mobile). Recording button 48px
- Nút "Claim reward" lớn dễ bấm; nút "Delete account" nhỏ góc xa

D. **Hick's Law** — RT = a + b·log₂(n+1)
- Thời gian quyết định ∝ log số lựa chọn
- Hệ quả: ≤7 option menu, group category, default smart (1-click "Gợi ý hôm nay" P2-2.2)

E. **Aesthetic-Usability Effect** (Norman) — bổ sung
- Cái đẹp được nhận thức là dễ dùng hơn, dù objectively bằng nhau
- Hệ quả: đầu tư visual polish có ROI cao cho first impression
- Bằng chứng: đánh giá "First impression 8/10 vì đẹp" — chính hiệu ứng này
- Cảnh báo: không thay thế usability thật — đẹp + khó vẫn rời user sau 1 tuần

F. **Goal-Gradient Effect** — bổ sung
- User nỗ lực tăng khi gần đích, chững lại giữa chừng
- Hệ quả: progress bar rõ %, "còn 2 bài nữa lên Gold", streak counter
- Áp dụng: Rank Tier (P3-3.2), streak (P6-6.2), mastery tree

G. **Von Restorff Effect** (isolation) — bổ sung
- Item khác biệt (màu/kích thước/vị trí) nổi bật, được nhớ
- Hệ quả: chỉ 1 item "primary CTA" khác màu trên màn hình
- Áp dụng: "Gợi ý hôm nay" nút nổi bật (P2-2.2), top-3 podium khác top 4-20 (P3-3.3)

H. **Doherty Threshold** — bổ sung
- Phản hồi <400ms = cảm giác tức thời; >2s = cảm giác chờ
- Hệ quả: feedback phát âm phải <400ms nếu có thể; >400ms phải có skeleton/spinner
- Áp dụng: skeleton loading (P1-1.4), speech feedback spinner

I. **Giới hạn phương pháp**
- Heuristic evaluation không thay thế user test
- Evaluator bias: người thiết kế khó thấy lỗi mình làm
- Khuyến nghị: heuristic để lọc lỗi rõ ràng trước, user test để bắt lỗi tinh tế

**Ví dụ từ PLAN:**
- animate-bounce vi phạm H8 (P1-1.1.3)
- badge "Đồ án tốt nghiệp" = extraneous clutter (P1-1.3.2)
- skeleton = H1 + Doherty (P1-1.4)
- confirm exit = H5 (P2-2.5)
- onboarding tour giảm cognitive load + H10 (P2-2.3)
- "Gợi ý hôm nay" = Hick + Von Restorff + Goal-Gradient (P2-2.2)
- Rank Tier = Goal-Gradient (P3-3.2)
- Podium top-3 khác = Von Restorff (P3-3.3)

**Quan hệ:** Complement `hci_consultant` (broad HCI: persona, design system, flow). hci_consultant cho *bức tranh lớn*, skill này cho *checklist 10 heuristic + 8 luật UX tập trung* (Fitts/Hick/Aesthetic-Usability/Goal-Gradient/Von Restorff/Doherty) mà hci_consultant không có chi tiết.

---

### 4.3 `ui-color-harmony/SKILL.md`

**Trigger:** Thay đổi class màu, thêm UI có màu, làm theme, Rank Tier color, đổi gradient, sửa contrast.

**Checklist:** 60-30-10 ratio · Semantic colors đúng · WCAG ≥ 4.5:1 text thường / 3:1 text lớn & UI · Dùng theme tokens không hardcode hex · Color blindness check · Tailwind 50-900 scale

**Lý thuyết cốt lõi (đầy đủ):**

A. **Quy tắc 60-30-10**
- Dominant 60%: background, base surface (neutral-50/white)
- Secondary 30%: sidebar, card, nav (primary-50, neutral-100)
- Accent 10%: CTA, highlight, badge (primary-500, accent-500)
- Lý do: cân bằng thị giác, mắt không bị mệt, focus vào accent
- Cách đo: screenshot → sample pixel → đếm tỷ lệ diện tích mỗi nhóm màu
- Vi phạm phổ biến: quá nhiều accent → mất focus; toàn neutral → nhàm chán

B. **Semantic color mapping** — CỐT LÕI
- success = green (success-500 #22C55E)
- warning = amber (warning-500 #F59E0B)
- error = soft-red (error-500 #EF4444) — không đỏ chói gây alarm
- info = blue (primary-500)
- TẠI SAO nhất quán: user học nghĩa màu qua lặp lại. Đổi = phá học = cognitive load
- Ngoại lệ: gamification currency có palette riêng — coins (yellow/orange), gems (purple/indigo), diamond (cyan) — vì currency không phải trạng thái hệ thống

C. **Color theory cơ bản**
- Hue (sắc màu) / Saturation (độ bão hòa) / Value (độ sáng)
- Warm (red/orange/yellow) = năng lượng, CTA, cảnh báo nhẹ
- Cool (blue/green/purple) = tin cậy, học tập, calm
- Ngữ cảnh Việt: đỏ = may mắn/Tết; nhưng trong UI đỏ = lỗi → cần phân biệt ngữ cảnh
- Color in context (Josef Albers): cùng 1 màu nhìn khác bên màu nền khác → kiểm trên nền thật

D. **Color blindness** — CỐT LÕI (nâng từ bullet thành nguyên tắc)
- ~8% nam deuteranopia/protanopia (không phân biệt đỏ-xanh), ~0.5% nữ
- Quy tắc: KHÔNG BAO GIỜ phân biệt trạng thái/thông tin CHỈ bằng màu
- Luôn kèm: icon + text + shape. Error = đỏ + icon ⚠ + chữ "Lỗi"
- Tool kiểm: Coblis simulator, Stark plugin, Chrome DevTools emulation
- Test: deuteranopia mode → mọi trạng thái vẫn phân biệt được

E. **WCAG 2.1 contrast**
- Text thường (<18px / <14px bold): ≥ 4.5:1 (AA), 7:1 (AAA)
- Text lớn (≥18px / ≥14px bold): ≥ 3:1 (AA), 4.5:1 (AAA)
- UI component & graphics: ≥ 3:1
- Công thức ratio: (L1+0.05)/(L2+0.05), L = relative luminance
- Tool: WebAIM Contrast Checker, Chrome DevTools contrast inspector
- Cách chọn: bắt với màu nền → tăng đậm đến khi đạt ratio

F. **Theme tokens vs hardcode hex**
- Dùng `--primary-500` / `bg-primary-500` / `text-success-600`, KHÔNG `#3B82F6`
- Lý do: (1) maintainability — đổi 1 chỗ; (2) theming — dark mode khi cần chỉ đổi token; (3) consistency — không lệch 1-2 shade
- Ngoại lệ: gradient 2 màu đôi khi cần hex, nhưng ưu tiên token

G. **Tailwind color scale 50-900** — CỐT LÕI (codebase dùng Tailwind)
- Cấu trúc: 50 (lightest tint) → 100 → 200 → ... → 500 (base) → 600 → 700 → 900 (darkest shade)
- Cách dùng hài hòa: cùng hue family cho 1 element. primary-50 bg + primary-500 border + primary-700 text
- Tint (50-200) cho background, base (500) cho border/icon, shade (700-900) cho text đậm
- Sai phổ biến: trộn hue family (primary-50 bg + success-500 border) → mất harmony

H. **Gamification tier color** — bổ sung cho P3-3.2
- Bronze #CD7F32 / Silver #C0C0C0 / Gold #FFD700 / Diamond #B9F2FF
- Text trên tier background: Bronze/Gold → text tối (neutral-900); Silver/Diamond → text tối (neutral-800)
- Kiểm contrast ≥ 4.5:1 cho text tier
- Tier border/icon dùng shade đậm hơn tier bg cho hierarchy

**Ví dụ từ PLAN:**
- coins yellow → gems purple gradient (P1-1.1.2): `from-purple-50 to-indigo-50` (Tailwind scale, semantic purple cho gems)
- Rank Tier 4 màu Bronze/Silver/Gold/Diamond (P3-3.2)
- Exercise feedback semantic states: success-green đúng, error-soft-red sai, warning-amber gần đúng
- Skeleton dùng `bg-neutral-200`/`bg-neutral-100` (Tailwind tint scale)

**Quan hệ:** Complement `accessibility` (WCAG contrast chi tiết, ARIA, keyboard) + `hci_consultant` (palette định nghĩa). Accessibility cho *a11y rộng*, skill này thêm *60-30-10 + color theory + color blindness testing + Tailwind scale + tier color* chưa có.

---

### 4.4 `web-usability-scales/SKILL.md`

**Trigger:** Đánh giá UX trước/sau thay đổi, đo cải thiện, kết thúc sprint, lập baseline cho roadmap.

**Checklist:** Estimated SUS cải thiện · UEQ 6 scale cải thiện (đặc biệt Stimulation) · WAMMI 5 scale cải thiện (đặc biệt Helpfulness) · Ghi bias & giới hạn

**Lý thuyết cốt lõi (đầy đủ):**

A. **SUS (System Usability Scale)** — Brooke 1996
- 10 câu Likert 5 điểm (1=Strongly Disagree → 5=Strongly Agree)
- **10 câu gốc (verbatim, song ngữ):**
  1. I think that I would like to use this system frequently — Tôi nghĩ mình muốn dùng hệ thống này thường xuyên
  2. I found the system unnecessarily complex — Tôi thấy hệ thống phức tạp không cần thiết
  3. I thought the system was easy to use — Tôi thấy hệ thống dễ dùng
  4. I think that I would need the support of a technical person to be able to use this system — Tôi nghĩ cần hỗ trợ kỹ thuật mới dùng được
  5. I found the various functions in this system were well integrated — Các chức năng tích hợp tốt
  6. I thought there was too much inconsistency in this system — Tôi thấy quá nhiều thiếu nhất quán
  7. I would imagine that most people would learn to use this system very quickly — Đa số người dùng sẽ học nhanh
  8. I found the system very cumbersome to use — Tôi thấy hệ thống rất cồng kềnh
  9. I felt very confident using the system — Tôi rất tự tin khi dùng
  10. I needed to learn a lot of things before I could get going with this system — Tôi cần học nhiều trước khi dùng được
- **Công thức chấm:**
  - Câu lẻ (1,3,5,7,9): điểm đóng góp = (X − 1)
  - Câu chẵn (2,4,6,8,10): điểm đóng góp = (5 − X)
  - Tổng đóng góp (0-40) × 2.5 = SUS score (0-100)
- **Benchmark:**
  - 68 = trung bình toàn cầu (Bangor, Sauro)
  - Thang A-F (Sauro-Lewis): A=85+, B=80-84, C=70-79, D=65-69, F=<65
  - Percentile: 68 = 50th, 75.9 = ~70th, 85.5 = 90th, 90 = 99th
- **Cảnh báo:** SUS adjective rating chỉ tham khảo, không tuyệt đối

B. **UEQ (User Experience Questionnaire)** — Laugwitz 2008
- 26 cặp từ đối lập (semantic differential), thang 7 điểm (-3 → +3)
- **6 scale (mỗi scale ý nghĩa):**
  - Attractiveness — tổng thể dễ thích, dễ chịu (6 item)
  - Perspicuity — dễ hiểu, dễ học (6 item)
  - Efficiency — nhanh, hiệu quả (4 item)
  - Dependability — đáng tin, dự đoán được (4 item)
  - Stimulation — thú vị, kích thích, đáng giá (4 item)
  - Novelty — mới mẻ, sáng tạo (3 item)
- **Skill sẽ reproducing đúng 26 word-pair gốc, mỗi item gán đúng 1 scale** theo Laugwitz 2008 (nguồn chuẩn: ueq-online.org). Spec này không liệt kê đầy đủ để tránh sai lệch item-to-scale mapping — khi viết skill phải đối chiếu bản chính thức.
- Đánh giá: mean > +0.8 tốt, -0.8 đến +0.8 trung tính, < -0.8 kém
- **Scale quan trọng cho gamified app: Stimulation** (đẩy bởi P3 ranking, P4 economy, P6 social)

C. **WAMMI (Website Analysis and MeasureMent Inventory)**
- 20 item Likert 5 điểm
- **5 scale:**
  - Attractiveness — hấp dẫn thị giác
  - Controllability — user kiểm soát được
  - Efficiency — hiệu quả hoàn thành task
  - Helpfulness — có help, onboarding, tooltip
  - Learnability — dễ học
- **Skill sẽ reproducing đúng 20 item gốc** theo WAMMI specification (nguồn: wammi.com). Spec không liệt kê đầy đủ — khi viết skill đối chiếu bản chính thức.
- **Trọng số cho app có onboarding:** Helpfulness + Learnability cao priority
- Áp dụng: P2 onboarding tour (P2-2.3) đẩy Helpfulness + Learnability

D. **Phương pháp heuristic estimation** (KHÔNG có user thật)
- Quy trình 4 bước:
  1. **Walkthrough task** — làm hết 1 user flow (vd: "học 1 bài phát âm, xem BXH, mua item shop")
  2. **Ánh xạ tới câu/scale** — mỗi bước flow chạm câu SUS nào, scale UEQ/WAMMI nào
  3. **Ước điểm** — expert chấm từng câu/scale (1-5 cho SUS, -3→+3 cho UEQ, 1-5 WAMMI) + ghi lý do
  4. **Ghi bias & giới hạn** — expert ≠ user thật, ghi nhận đâu chủ quan
- **Template ước lượng (AI dùng):**
  ```
  | Câu SUS | Điểm ước (1-5) | Lý do |
  |---------|----------------|-------|
  | 1. Dùng thường xuyên | 4 | Streak + daily reward kéo về |
  | 2. Phức tạp không cần thiết | 2 | Sidebar nhiều widget (P2 sẽ sửa) |
  | ... | | |
  ```
- Tính SUS: áp công thức A → số → so benchmark

E. **Before/after comparison cho roadmap**
- Đánh giá baseline (hiện tại): SUS ~75 (B), Gamification 6.3 (từ UI_UX_COMPREHENSIVE_EVALUATION)
- Sau mỗi sprint: ước lại SUS + UEQ Stimulation + WAMMI Helpfulness → so sánh → xác nhận cải thiện
- Nếu sau sprint điểm GIẢM → flag: thay đổi có thể hại UX, cần review lại

F. **Giới hạn method**
- Heuristic estimation CHỈ dùng so sánh tương đối before/after, KHÔNG dùng công bố số tuyệt đối
- Bias: expert thường chấm cao hơn user thật (vì quen)
- Không thay thế user test thật (5+ user) trước production release lớn

**Ví dụ từ PLAN:**
- Baseline: SUS ~75 (B), Gamification 6.3, Production 4.4
- P3 (ranking visibility + tier + podium) → đẩy UEQ Stimulation + SUS câu 5 (functions integrated)
- P2 (onboarding tour) → đẩy WAMMI Helpfulness + Learnability + SUS câu 4 (need support ↓) + câu 10 (need learn ↓)
- P1 (skeleton, currency, dead code) → đẩy SUS câu 6 (consistency ↑) + câu 8 (cumbersome ↓)
- P5 (phonetic explanation) → đẩy SUS câu 9 (confident ↑) + UEQ Dependability

**Quan hệ:** Hoàn toàn mới — không skill nào đo lường usability. Dùng kết thúc sprint cùng `project-quality-gate` (project-quality-gate cho *code quality/build*, skill này cho *UX quality*).

---

## 5. Các việc đi kèm (sau khi tạo 4 file)

1. Cập nhật `PLAN/05_AI_Skills/AI_SKILLS_INVENTORY.md` — thêm 4 skill vào danh sách, ghi rõ subgroup `SKILL/`, mô tả trigger
2. Cập nhật `PLAN/05_AI_Skills/SKILL_USAGE_BY_PHASE.md` — thêm mapping:
   - Phase 6 (UI/UX): đọc 4 skill này (cùng hci_consultant, accessibility)
   - Mọi phase khi chạm UI: đọc nielsen-ux-heuristics + ui-color-harmony
   - Kết thúc sprint UI/UX: đọc web-usability-scales
3. Cập nhật `PLAN/03_UI_UX/IMPROVEMENT_ROADMAP_INDEX.md` — ghi chú 4 skill đã tồn tại thật tại `.agents/skills/SKILL/`, link đường dẫn chính xác

---

## 6. Không làm (YAGNI)

- Không tạo skill ngoài 4 đã chốt (NASA-TLX, ASQ, Serial Position Effect, Pareto-in-UX, Tesler's Law...) — không trực tiếp phục vụ 27 task trong IMPROVEMENT_P1..P6
- Không sửa 14 skill gốc (architect-mode, hci_consultant, accessibility...) — giữ nguyên, 4 skill mới bổ sung song song
- Không di chuyển skill nào khỏi `.agents/skills/`
- Không tạo test cho skill (skill là markdown hướng dẫn, không phải code)

---

## 7. Xác minh sau khi tạo

- [ ] 4 file `SKILL.md` tồn tại tại `.agents/skills/SKILL/<tên>/SKILL.md`
- [ ] Mỗi file có YAML frontmatter `name` + `description` (khớp format 14 skill gốc)
- [ ] Mỗi file đủ các section: Khi nào dùng / Checklist / Lý thuyết cốt lõi / Ví dụ / Quan hệ
- [ ] `AI_SKILLS_INVENTORY.md` có 4 skill mới trong danh sách
- [ ] `SKILL_USAGE_BY_PHASE.md` có mapping Phase 6
- [ ] `IMPROVEMENT_ROADMAP_INDEX.md` link đúng đường dẫn skill
- [ ] Không skill nào trùng tên với 14 skill gốc
