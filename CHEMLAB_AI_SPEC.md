# ChemLab AI – Phòng Thí Nghiệm Hóa Học Ảo (Spec cho AI Agent)

> Tài liệu này dành cho AI coding agent (Claude Code, Cursor, v.v.). Hãy đọc toàn bộ trước khi viết code, làm tuần tự theo mục **13. Kế hoạch triển khai**, và tuân thủ mục **14. Quy tắc cho Agent**.

---

## 1. Tổng quan

**ChemLab AI** là web app mô phỏng phòng thí nghiệm hóa học 2D cho học sinh THCS. Học sinh chọn 2 hóa chất, đổ vào cốc, xem hiện tượng (đổi màu, sủi bọt, kết tủa, tỏa nhiệt) bằng animation, rồi đọc phân tích do AI/dữ liệu có sẵn cung cấp (phương trình, phương trình ion rút gọn, giải thích, cảnh báo an toàn). Phản ứng đã khám phá được lưu vào "Sổ tay thí nghiệm" và mở khóa danh hiệu "Nhà Giả Kim Nhí".

**Giá trị:** thực hành thí nghiệm không lo cháy nổ hay thiếu hóa chất.

**Giai đoạn hiện tại:** DEMO. Ưu tiên: chạy mượt, đẹp, ổn định khi trình diễn, **chi phí = 0 đồng** (chỉ dùng free tier).

### Ràng buộc cứng
- Chi phí 0: Vercel Hobby, Neon Free, Gemini API free tier.
- Không dùng 3D (Three.js/WebGL). Chỉ 2D: SVG + Framer Motion + CSS.
- Chạy tốt trên máy yếu và mobile.
- Ngôn ngữ giao diện: **tiếng Việt**. Code, tên biến, comment: tiếng Anh.

---

## 2. Tech Stack

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS, Framer Motion |
| Công thức | KaTeX (`react-katex` hoặc `katex` trực tiếp) |
| Validate | Zod |
| DB | NeonDB (Postgres) qua `@neondatabase/serverless` (SQL thuần) |
| AI | Gemini Flash qua SDK chính thức của Google GenAI |
| Deploy | Vercel |

> **Lưu ý:** Tên model và tên package SDK thay đổi theo thời gian. KHÔNG hard-code `gemini-1.5-flash` (đã cũ). Đọc model từ env `GEMINI_MODEL` và kiểm tra tài liệu SDK hiện hành khi cài đặt.

---

## 3. Biến môi trường (`.env.local`, và cấu hình trên Vercel)

```
DATABASE_URL=postgres://...            # chuỗi kết nối Neon
GEMINI_API_KEY=...                      # từ Google AI Studio
GEMINI_MODEL=<tên model Flash hiện hành>
RATE_LIMIT_PER_MINUTE=10               # số lần gọi AI / IP / phút
```

Tạo file `.env.example` với các key trên (không có giá trị thật). Không commit `.env.local`.

---

## 4. Cấu trúc thư mục

```
chemlab-ai/
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                      # trang chính (Lab)
│  ├─ globals.css                   # keyframes bubble, smoke...
│  └─ api/
│     ├─ react/route.ts             # POST: phân tích phản ứng
│     └─ notebook/route.ts          # GET/POST: sổ tay + danh hiệu
├─ components/
│  ├─ lab/
│  │  ├─ LabBench.tsx               # khu trung tâm
│  │  ├─ Beaker.tsx                 # cốc SVG + hiệu ứng
│  │  ├─ Bubbles.tsx
│  │  ├─ Precipitate.tsx
│  │  ├─ Smoke.tsx
│  │  ├─ PourAnimation.tsx
│  │  └─ MetalPiece.tsx             # kim loại dạng rắn
│  ├─ shelf/
│  │  ├─ ReagentShelf.tsx           # sidebar trái
│  │  └─ ReagentBottle.tsx
│  ├─ analysis/
│  │  ├─ AnalysisPanel.tsx          # sidebar phải
│  │  ├─ Equation.tsx               # render KaTeX
│  │  ├─ QuizCard.tsx
│  │  └─ ObservingLoader.tsx
│  ├─ notebook/
│  │  ├─ NotebookDrawer.tsx
│  │  └─ BadgeChip.tsx
│  └─ NicknameDialog.tsx
├─ lib/
│  ├─ reagents.ts                   # danh sách hóa chất
│  ├─ reactions.json                # dữ liệu SGK (Tầng 1)
│  ├─ pairKey.ts                    # chuẩn hóa khóa cặp chất
│  ├─ schema.ts                     # Zod schema ReactionResult
│  ├─ engine.ts                     # hybrid engine (3 tầng)
│  ├─ gemini.ts                     # gọi AI + prompt
│  ├─ db.ts                         # kết nối Neon
│  ├─ rateLimit.ts
│  └─ badges.ts                     # tính danh hiệu từ số phản ứng
├─ db/
│  └─ schema.sql
├─ scripts/
│  └─ warm-cache.ts                 # chạy trước demo để nạp cache
├─ .env.example
└─ CHEMLAB_AI_SPEC.md               # file này
```

---

## 5. Mô hình dữ liệu

### 5.1 Hóa chất (`lib/reagents.ts`)

```ts
export type ReagentGroup = "acid_base" | "salt" | "metal";
export type ReagentState = "solution" | "solid";

export interface Reagent {
  id: string;            // "cuso4"
  formula: string;       // "CuSO4"
  nameVi: string;        // "Đồng(II) sunfat"
  group: ReagentGroup;
  state: ReagentState;   // metal = "solid"
  color: string;         // màu dung dịch ban đầu (HEX); kim loại: màu kim loại
  labelColor: string;    // màu nhãn lọ theo nhóm
}
```

**Danh sách ban đầu (14 chất):**

| id | formula | Tên VI | group | state | color |
|---|---|---|---|---|---|
| hcl | HCl | Axit clohiđric | acid_base | solution | `#e0f2fe` |
| h2so4 | H2SO4 | Axit sunfuric loãng | acid_base | solution | `#e0f2fe` |
| naoh | NaOH | Natri hiđroxit | acid_base | solution | `#e0f2fe` |
| caoh2 | Ca(OH)2 | Nước vôi trong | acid_base | solution | `#e0f2fe` |
| cuso4 | CuSO4 | Đồng(II) sunfat | salt | solution | `#60a5fa` |
| bacl2 | BaCl2 | Bari clorua | salt | solution | `#e0f2fe` |
| na2co3 | Na2CO3 | Natri cacbonat | salt | solution | `#e0f2fe` |
| agno3 | AgNO3 | Bạc nitrat | salt | solution | `#e0f2fe` |
| nacl | NaCl | Natri clorua | salt | solution | `#e0f2fe` |
| fecl3 | FeCl3 | Sắt(III) clorua | salt | solution | `#fbbf24` |
| fe | Fe | Sắt | metal | solid | `#6b7280` |
| zn | Zn | Kẽm | metal | solid | `#9ca3af` |
| mg | Mg | Magie | metal | solid | `#d1d5db` |
| cu | Cu | Đồng | metal | solid | `#b45309` |

Màu nhãn: axit/bazơ = đỏ/xanh dương nhạt, muối = xám, kim loại = cam.

### 5.2 Khóa cặp chất (`lib/pairKey.ts`)

Khóa phải **không phụ thuộc thứ tự**: sắp xếp 2 id theo alphabet rồi nối bằng `+`.

```ts
export const pairKey = (a: string, b: string) => [a, b].sort().join("+");
// pairKey("naoh","cuso4") === "cuso4+naoh"
```

### 5.3 Kết quả phản ứng (`lib/schema.ts` – Zod)

```ts
import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ReactionResultSchema = z.object({
  has_reaction: z.boolean(),
  reaction_type: z.enum([
    "trao_doi", "the", "trung_hoa", "phan_huy", "khong_phan_ung",
  ]),
  equation: z.string(),                 // "CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4"
  ionic_equation: z.string().nullable(),// "Cu²⁺ + 2OH⁻ → Cu(OH)₂↓"
  visual_effects: z.object({
    final_liquid_color: hex,
    has_gas: z.boolean(),
    gas_color: hex.nullable(),
    has_precipitate: z.boolean(),
    precipitate_color: hex.nullable(),
    heat_level: z.enum(["normal", "exothermic", "endothermic"]),
  }),
  explanation: z.string(),              // 2 câu, dễ hiểu cho HS THCS
  safety_note: z.string().nullable(),
  quiz: z.object({
    question: z.string(),               // "Vì sao xuất hiện kết tủa?"
    options: z.array(z.string()).length(3),
    correct_index: z.number().int().min(0).max(2),
    explanation: z.string(),
  }).nullable(),
});

export type ReactionResult = z.infer<typeof ReactionResultSchema>;
```

Kiểm tra thêm sau khi parse: nếu `has_reaction=false` thì `has_precipitate=false`, `has_gas=false`.

### 5.4 Database (`db/schema.sql`)

```sql
-- Cache kết quả (Tầng 2). Mỗi cặp chất chỉ gọi AI một lần.
CREATE TABLE IF NOT EXISTS reaction_cache (
  pair_key   TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  source     TEXT NOT NULL DEFAULT 'ai',      -- 'ai' | 'manual'
  verified   BOOLEAN NOT NULL DEFAULT FALSE,  -- để sửa tay kết quả sai
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phản ứng học sinh đã khám phá (không cần đăng nhập, dùng biệt danh)
CREATE TABLE IF NOT EXISTS discovered_reactions (
  id            SERIAL PRIMARY KEY,
  student_name  VARCHAR(40) NOT NULL,
  pair_key      TEXT NOT NULL,
  equation      TEXT NOT NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_name, pair_key)
);
CREATE INDEX IF NOT EXISTS idx_discovered_student ON discovered_reactions (student_name);

-- Giới hạn tốc độ theo IP
CREATE TABLE IF NOT EXISTS rate_limit (
  ip           TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count        INT NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, window_start)
);
```

> Không tạo bảng `user_badges`. Danh hiệu **tính từ** `COUNT(*)` của `discovered_reactions` theo `student_name`.

### 5.5 Danh hiệu (`lib/badges.ts`)

| Số phản ứng đã khám phá | Danh hiệu |
|---|---|
| 0 | Chưa có |
| 1–4 | Tập sự |
| 5–9 | Nhà nghiên cứu |
| ≥ 10 | Bậc thầy Hóa học |

Chỉ tính phản ứng có `has_reaction = true`.

---

## 6. Hybrid Engine – 3 tầng (`lib/engine.ts`)

```
resolveReaction(idA, idB):
  1. Validate idA, idB ∈ reagents, idA ≠ idB
  2. key = pairKey(idA, idB)
  3. Tầng 1: tra reactions.json[key]        → trả về (source: "local")
  4. Tầng 2: SELECT payload FROM reaction_cache WHERE pair_key = key
                                            → trả về (source: "cache")
  5. Tầng 3: kiểm tra rate limit → gọi Gemini → Zod validate
             (sai schema: thử lại đúng 1 lần)
             → INSERT vào reaction_cache → trả về (source: "ai")
  6. Mọi lỗi ở Tầng 3 → trả HTTP 200 với { error: "fallback", message } để UI hiện thông báo thân thiện
```

Quy tắc:
- Với tổ hợp **không phản ứng** (VD `cu + hcl`, `nacl + hcl`), vẫn là kết quả hợp lệ: `has_reaction=false`, `reaction_type="khong_phan_ung"`, giải thích ngắn vì sao.
- Chỉ nhận id hóa chất, **không nhận chuỗi tự do** từ client vào prompt (chống prompt injection).

---

## 7. API

### `POST /api/react`
Request: `{ "a": "cuso4", "b": "naoh" }`

Response thành công:
```json
{ "source": "local|cache|ai", "key": "cuso4+naoh", "result": { /* ReactionResult */ } }
```
Response lỗi mềm (HTTP 200):
```json
{ "error": "fallback", "message": "AI đang bận, em thử cặp chất khác nhé!" }
```
Lỗi đầu vào (HTTP 400): id không hợp lệ hoặc trùng nhau.
Vượt rate limit (HTTP 429): message thân thiện.

### `GET /api/notebook?name=<nickname>`
Trả về `{ reactions: [{pair_key, equation, discovered_at}], count, badge }`.

### `POST /api/notebook`
Body: `{ "name": "Minh", "key": "cuso4+naoh" }`. Server tự lấy `equation` từ engine (local/cache), **không tin dữ liệu equation từ client**. Dùng `INSERT ... ON CONFLICT DO NOTHING`. Chỉ lưu khi `has_reaction = true`. Trả về `{ count, badge, isNew }`.

`name`: trim, 1–40 ký tự, loại bỏ ký tự điều khiển.

---

## 8. Prompt Gemini (`lib/gemini.ts`)

Cấu hình: `responseMimeType: "application/json"`, temperature thấp (~0.2). Prompt (tiếng Việt), chèn công thức và tên từ `reagents.ts` (không chèn text tự do của người dùng):

```
Bạn là giáo viên Hóa học THCS Việt Nam. Phân tích phản ứng giữa "{nameA} ({formulaA})" và "{nameB} ({formulaB})"
ở điều kiện phòng, dung dịch loãng, chương trình THCS.

Quy tắc:
- Chỉ dùng kiến thức hóa học chính xác. Nếu không phản ứng, đặt has_reaction=false.
- Phương trình phải cân bằng, dùng ↓ cho kết tủa, ↑ cho khí.
- ionic_equation: phương trình ion rút gọn, null nếu không phản ứng.
- Màu HEX phải đúng 6 chữ số dạng #RRGGBB.
- explanation: đúng 2 câu, dễ hiểu cho học sinh lớp 8-9.
- safety_note: cảnh báo an toàn ngoài đời thật, null nếu không cần.
- quiz: 1 câu hỏi 3 đáp án về bản chất hiện tượng, null nếu không phản ứng.
- Chỉ trả về JSON thuần, đúng schema sau: { ...schema ReactionResult... }
```

Nếu kết quả không qua Zod: thử lại 1 lần với thêm câu "Hãy sửa lại để đúng schema." Vẫn sai: trả lỗi mềm.

---

## 9. Dữ liệu SGK ban đầu (`lib/reactions.json`)

Tạo file `lib/reactions.json` là object với **key = pairKey**, value = `ReactionResult`. Dưới đây là phần dữ liệu đầy đủ cho 14 phản ứng; agent phải chuyển thành JSON hợp lệ, thêm trường `quiz` cho mỗi phản ứng có hiện tượng nổi bật (kết tủa, khí), và điền `explanation`, `safety_note` phù hợp.

| key | equation | ionic_equation | type | liquid | gas | precipitate | heat |
|---|---|---|---|---|---|---|---|
| `hcl+naoh` | HCl + NaOH → NaCl + H₂O | H⁺ + OH⁻ → H₂O | trung_hoa | `#e0f2fe` | – | – | exothermic |
| `h2so4+naoh` | H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O | H⁺ + OH⁻ → H₂O | trung_hoa | `#e0f2fe` | – | – | exothermic |
| `cuso4+naoh` | CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄ | Cu²⁺ + 2OH⁻ → Cu(OH)₂↓ | trao_doi | `#e0f2fe` | – | `#3b82f6` (xanh lam) | normal |
| `bacl2+h2so4` | BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl | Ba²⁺ + SO₄²⁻ → BaSO₄↓ | trao_doi | `#e0f2fe` | – | `#f8fafc` (trắng) | normal |
| `hcl+na2co3` | Na₂CO₃ + 2HCl → 2NaCl + CO₂↑ + H₂O | CO₃²⁻ + 2H⁺ → CO₂↑ + H₂O | trao_doi | `#e0f2fe` | `#ffffff` | – | normal |
| `h2so4+na2co3` | Na₂CO₃ + H₂SO₄ → Na₂SO₄ + CO₂↑ + H₂O | CO₃²⁻ + 2H⁺ → CO₂↑ + H₂O | trao_doi | `#e0f2fe` | `#ffffff` | – | normal |
| `agno3+nacl` | AgNO₃ + NaCl → AgCl↓ + NaNO₃ | Ag⁺ + Cl⁻ → AgCl↓ | trao_doi | `#e0f2fe` | – | `#f1f5f9` (trắng) | normal |
| `agno3+hcl` | AgNO₃ + HCl → AgCl↓ + HNO₃ | Ag⁺ + Cl⁻ → AgCl↓ | trao_doi | `#e0f2fe` | – | `#f1f5f9` | normal |
| `fecl3+naoh` | FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl | Fe³⁺ + 3OH⁻ → Fe(OH)₃↓ | trao_doi | `#e0f2fe` | – | `#92400e` (nâu đỏ) | normal |
| `bacl2+na2co3` | BaCl₂ + Na₂CO₃ → BaCO₃↓ + 2NaCl | Ba²⁺ + CO₃²⁻ → BaCO₃↓ | trao_doi | `#e0f2fe` | – | `#f8fafc` | normal |
| `caoh2+na2co3` | Ca(OH)₂ + Na₂CO₃ → CaCO₃↓ + 2NaOH | Ca²⁺ + CO₃²⁻ → CaCO₃↓ | trao_doi | `#e0f2fe` | – | `#f8fafc` | normal |
| `cuso4+fe` | Fe + CuSO₄ → FeSO₄ + Cu↓ | Fe + Cu²⁺ → Fe²⁺ + Cu↓ | the | `#bbf7d0` (xanh lục nhạt) | – | `#b45309` (đỏ gạch) | normal |
| `cuso4+zn` | Zn + CuSO₄ → ZnSO₄ + Cu↓ | Zn + Cu²⁺ → Zn²⁺ + Cu↓ | the | `#e0f2fe` (mất màu xanh) | – | `#b45309` | exothermic |
| `hcl+zn` | Zn + 2HCl → ZnCl₂ + H₂↑ | Zn + 2H⁺ → Zn²⁺ + H₂↑ | the | `#e0f2fe` | `#ffffff` | – | normal |
| `hcl+mg` | Mg + 2HCl → MgCl₂ + H₂↑ | Mg + 2H⁺ → Mg²⁺ + H₂↑ | the | `#e0f2fe` | `#ffffff` | – | exothermic |

Ghi chú nội dung:
- `safety_note` mặc định cho axit/bazơ đặc: "Ngoài đời thật, axit và bazơ ăn da. Luôn đeo kính và găng tay."
- Khí H₂ dễ cháy nổ: ghi cảnh báo tránh xa lửa.
- Một vài cặp **không phản ứng** (VD `cu+hcl`, `nacl+hcl`, `nacl+naoh`) nên được thêm vào `reactions.json` để demo trường hợp "không hiện tượng", với `has_reaction=false`.

---

## 10. Đặc tả giao diện

### 10.1 Bố cục
- **Desktop (≥ 1024px):** 3 cột `grid-cols-[260px_1fr_340px]`: Kệ hóa chất | Bàn lab | Bảng phân tích.
- **Mobile:** xếp dọc: thanh kệ cuộn ngang → bàn lab → bảng phân tích. Sổ tay là drawer trượt từ dưới.
- Nền sáng trung tính, bàn lab màu gỗ nhạt. **Màu dung dịch là điểm nhấn duy nhất** của giao diện.
- Thanh trên cùng: logo, ô biệt danh, huy hiệu hiện tại, nút "Sổ tay".

### 10.2 Kệ hóa chất (`ReagentShelf`)
- 3 tab: Axit & Bazơ | Muối | Kim loại.
- Mỗi chất là `ReagentBottle` (SVG lọ + nhãn công thức + tên). Click để chọn.
- Có 2 ô "Chất A" và "Chất B" hiển thị chất đã chọn; click lại để bỏ chọn. Không cho chọn cùng một chất 2 lần.
- Khi đủ 2 chất, nút **"Thực hiện thí nghiệm"** sáng lên.
- **Không làm kéo thả** ở phase demo.

### 10.3 Bàn lab (`LabBench`)
- Cốc `Beaker` ở giữa. Nút: **"Làm sạch cốc (Reset)"**. (Chưa làm "đun đèn cồn", "đổ thêm nước".)
- Trạng thái trống: dòng hướng dẫn "Chọn 2 hóa chất để bắt đầu thí nghiệm".
- Gợi ý nhiệm vụ đầu tiên: "Thử trộn đồng sunfat với natri hiđroxit".

### 10.4 Bảng phân tích (`AnalysisPanel`)
Hiện lần lượt (stagger ~250ms mỗi khối):
1. Loại phản ứng (chip)
2. Phương trình (KaTeX)
3. Phương trình ion rút gọn (KaTeX)
4. Giải thích bản chất
5. Khung cảnh báo an toàn (nền đỏ nhạt, biểu tượng cảnh báo; nếu là tổ hợp rất nguy hiểm ngoài đời: thêm dòng "Không bao giờ tự làm ngoài đời")
6. `QuizCard`: 3 đáp án, chọn xong hiện đúng/sai + giải thích (dữ liệu từ `quiz`, **không gọi thêm AI**)
7. Toast "Mở khóa phản ứng mới!" khi `isNew=true`

### 10.5 Equation (`Equation.tsx`)
Chuyển chuỗi phương trình sang KaTeX: chỉ số dưới/trên (`H₂O` → `H_2O`), ↓ → `\downarrow`, ↑ → `\uparrow`, → → `\rightarrow`. Nếu parse lỗi thì hiển thị text thuần, không để crash.

---

## 11. Đặc tả animation

Công cụ: Framer Motion cho chuyển trạng thái, CSS keyframes cho hiệu ứng lặp. **Chỉ animate `transform` và `opacity`** (riêng mực nước dùng `height`/`backgroundColor` của một div duy nhất).

### 11.1 Props của `Beaker`
```ts
interface BeakerProps {
  liquidColor: string;
  liquidLevel: number;          // 0–100
  hasGas: boolean;
  gasColor?: string | null;
  hasPrecipitate: boolean;
  precipitateColor?: string | null;
  heat: "normal" | "exothermic" | "endothermic";
  solidPiece?: { color: string } | null; // kim loại thả vào
}
```
`Beaker` phải test được độc lập bằng một trang `/dev` có nút giả lập từng hiệu ứng.

### 11.2 Timeline một thí nghiệm
| Thời điểm | Sự kiện |
|---|---|
| 0.0s | Lọ A nghiêng, đổ vào cốc (mực nước dâng, màu = màu chất A). Kim loại: thả khối rắn rơi xuống |
| 0.8s | Lọ B nghiêng, đổ tiếp (màu pha dần) |
| 1.6s | Cốc "khuấy" nhẹ; bắt đầu gọi engine (nếu chưa có kết quả hiện `ObservingLoader`) |
| 2.0s | Khi có kết quả: chuyển màu sang `final_liquid_color` (0.8s, easeInOut) |
| 2.4s | Nếu có khí: bắt đầu sủi bọt (lặp). Nếu có kết tủa: hạt rơi rồi nén thành lớp cặn (1s) |
| 2.4s | Nếu `exothermic`: cốc rung nhẹ + làn khói mờ bốc lên. `endothermic`: viền cốc đổi sắc lạnh |
| 3.2s | Bảng phân tích bắt đầu hiện |

Nếu kết quả có sẵn từ Tầng 1/2, bỏ `ObservingLoader` và rút ngắn timeline tương ứng.

### 11.3 Chi tiết hiệu ứng
- **Mực nước:** `motion.div` tuyệt đối ở đáy cốc, `animate={{ height: level+"%", backgroundColor }}`, `transition: { duration: 0.8, ease: "easeInOut" }`.
- **Bọt khí:** 8–10 `<span>` tròn trắng mờ, CSS `bubble-rise` (translateY -120px, scale 0.5→1.2, opacity 0→0.8→0), delay ngẫu nhiên khác nhau, `infinite`.
```css
@keyframes bubble-rise {
  0%   { transform: translateY(0) scale(0.5); opacity: 0; }
  50%  { opacity: 0.8; }
  100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
}
```
- **Kết tủa:** ≤ 20 hạt rơi từ giữa cốc xuống đáy (stagger), sau đó một lớp cặn `h-3` xuất hiện dần ở đáy bằng `precipitateColor`.
- **Khói/nhiệt:** 3–4 vệt mờ bay lên và tan (opacity + translateY + blur nhẹ); rung cốc bằng `animate={{ x: [0,-2,2,-2,0] }}`, lặp ngắn rồi dừng.
- **ObservingLoader:** kính lúp/ống nghiệm đung đưa kèm dòng chữ "Đang quan sát thí nghiệm...". Không dùng spinner trống.
- Tôn trọng `prefers-reduced-motion`: tắt hiệu ứng lặp, chỉ đổi màu.
- Khi hiệu ứng kết thúc hoặc bấm Reset: gỡ hạt/bọt khỏi DOM.

---

## 12. Xử lý lỗi và trường hợp biên

| Tình huống | Hành vi |
|---|---|
| Chọn cùng một chất 2 lần | Chặn ở UI; API trả 400 |
| Gemini hết quota / lỗi mạng | Thông báo "AI đang bận, em thử cặp khác nhé" + gợi ý 3 cặp chất có sẵn |
| JSON AI sai schema | Retry 1 lần, rồi báo lỗi mềm |
| Vượt rate limit | HTTP 429 + thông báo; vẫn dùng được Tầng 1/2 |
| Không phản ứng | Hiện animation trộn màu bình thường, phân tích "không có hiện tượng" |
| Chưa nhập biệt danh | Dùng "Khách", nhắc nhập để lưu sổ tay |
| Lỗi DB khi lưu sổ tay | Toast lỗi, thí nghiệm vẫn hiển thị bình thường |
| Hai chất tạo ra phản ứng nguy hiểm ngoài đời | Hiện `safety_note` nổi bật; **không** đưa hướng dẫn thực hiện ngoài đời |

---

## 13. Kế hoạch triển khai (làm tuần tự, mỗi bước có tiêu chí nghiệm thu)

**Bước 0 – Khởi tạo**
- `create-next-app` (TypeScript, Tailwind, App Router), cài `framer-motion`, `zod`, `katex`, `@neondatabase/serverless`, SDK Google GenAI.
- Tạo `.env.example`. *Nghiệm thu:* `npm run dev` chạy được.

**Bước 1 – Beaker độc lập**
- `Beaker`, `Bubbles`, `Precipitate`, `Smoke`, trang `/dev` có nút giả lập từng hiệu ứng.
- *Nghiệm thu:* mỗi hiệu ứng chạy mượt, không giật trên mobile, reset sạch DOM.

**Bước 2 – Dữ liệu và kệ hóa chất**
- `reagents.ts`, `pairKey.ts`, `reactions.json` (15 phản ứng + vài cặp không phản ứng), `ReagentShelf`.
- *Nghiệm thu:* chọn được 2 chất, cặp `cuso4+naoh` tra được JSON.

**Bước 3 – Luồng thí nghiệm (chưa có AI)**
- `LabBench` + timeline 11.2 + `AnalysisPanel` + `Equation` (KaTeX) + `QuizCard`.
- *Nghiệm thu:* 15 phản ứng SGK chạy đúng hiệu ứng và hiển thị đúng phương trình.

**Bước 4 – Database và sổ tay**
- Chạy `db/schema.sql` trên Neon, `lib/db.ts`, `/api/notebook`, `NicknameDialog`, `NotebookDrawer`, `badges.ts`.
- *Nghiệm thu:* khám phá phản ứng → xuất hiện trong sổ tay, không trùng lặp, danh hiệu đúng ngưỡng.

**Bước 5 – Hybrid Engine + Gemini**
- `schema.ts`, `gemini.ts`, `engine.ts`, `rateLimit.ts`, `/api/react`.
- *Nghiệm thu:* cặp lạ (VD `zn+agno3`) gọi AI lần 1, lần 2 lấy từ cache (nhanh); lỗi hiện thông báo mềm; rate limit hoạt động.

**Bước 6 – Hoàn thiện UI**
- Responsive mobile, ObservingLoader, toast, âm thanh nhỏ (có nút tắt), trạng thái trống, `prefers-reduced-motion`, metadata/OG image.
- *Nghiệm thu:* Lighthouse Performance ≥ 85 trên mobile, không lỗi console.

**Bước 7 – Chuẩn bị demo**
- `scripts/warm-cache.ts`: chạy tất cả cặp trong `reactions.json` và vài cặp lạ để nạp sẵn `reaction_cache`.
- Deploy Vercel, cấu hình env, kiểm thử trên URL thật bằng điện thoại.
- Viết kịch bản demo 3 phút: (1) trung hòa HCl+NaOH, (2) kết tủa xanh CuSO₄+NaOH, (3) sủi bọt Na₂CO₃+HCl, (4) cặp lạ qua AI, (5) mở sổ tay và danh hiệu.

---

## 14. Quy tắc cho Agent

1. Làm theo thứ tự mục 13; hoàn thành và tự kiểm tra tiêu chí nghiệm thu của mỗi bước trước khi sang bước tiếp.
2. Không thêm thư viện nặng (3D, UI kit lớn) nếu không cần. Không dùng dịch vụ trả phí.
3. Không hard-code bí mật; mọi khóa lấy từ env. Không log API key.
4. Mọi dữ liệu từ client phải được validate (Zod) ở server. Client **chỉ gửi id hóa chất**, không gửi văn bản tự do vào prompt.
5. Component animation phải dọn dẹp (cleanup) hạt/bọt/timer khi unmount hoặc reset.
6. Mọi chuỗi hiển thị cho người dùng bằng tiếng Việt, giọng thân thiện, phù hợp học sinh THCS.
7. Nội dung hóa học phải chính xác; khi không chắc, ưu tiên `has_reaction=false` cùng giải thích thận trọng hơn là bịa phản ứng. Đánh dấu dữ liệu cần giáo viên kiểm tra bằng comment `// TODO(verify)`.
8. Không đưa hướng dẫn điều chế chất nguy hiểm; chỉ cảnh báo và giải thích bản chất ở mức giáo dục THCS.
9. Giữ code TypeScript strict, không dùng `any`. Chạy `npm run lint` và `npm run build` trước khi báo hoàn thành mỗi bước.
10. Cuối mỗi bước: cập nhật mục "Tiến độ" bên dưới.

---

## 15. Tiến độ

- [x] Bước 0 – Khởi tạo (Next.js 15 + TS strict + Tailwind 4 + Framer Motion + KaTeX + Zod + Neon + Google GenAI; `npm run build` xanh)
- [x] Bước 1 – Beaker độc lập (Beaker/Bubbles/Precipitate/Smoke/PourAnimation/MetalPiece + trang `/dev` test từng hiệu ứng, cleanup qua unmount, tôn trọng `prefers-reduced-motion`)
- [x] Bước 2 – Dữ liệu và kệ hóa chất (14 chất, 3 tab, 21 cặp SGK+ngoài-SGK trong `reactions.json` qua Zod, pairKey order-independent đã kiểm chứng)
- [x] Bước 3 – Luồng thí nghiệm (timeline 11.2, AnalysisPanel stagger 250ms, Equation KaTeX tự chuyển chỉ số, QuizCard 3 đáp án; `/api/react` trả đúng ReactionResult cho cặp SGK)
- [x] Bước 4 – Database và sổ tay (db/schema.sql, lib/db.ts fail-open khi thiếu DATABASE_URL, /api/notebook GET/POST sức khoẻ, NicknameDialog localStorage, NotebookDrawer bottom-sheet, badges theo COUNT(*))
- [x] Bước 5 – Hybrid Engine + Gemini (3 tầng local→cache→AI, retry đúng 1 lần, rate limit theo IP mỗi phút, lỗi mềm HTTP 200; cần env `GEMINI_API_KEY`+`GEMINI_MODEL` để nghiệm thu cặp thật)
- [x] Bước 6 – Hoàn thiện UI (responsive mobile, ObservingLoader, toast, âm thanh WebAudio + nút tắt 🔊, trạng thái trống, prefers-reduced-motion, metadata; Lighthouse cần nghiệm thu trên máy thật)
- [x] Bước 7 – Chuẩn bị demo (`npm run db:init` 6 câu lệnh schema OK; `npm run warm-cache` 24/24 cặp thành công gồm AI zn+agno3/fe+agno3/h2so4+fe; smoke `/` `/hoc` `/lab` `/api/lessons` `/api/notebook` `/api/react` = 200 sau khi xóa `.next` + restart port 3000; còn lại tùy chọn: deploy Vercel + cấu hình env production)

> **Cần người dùng cấu hình (không thể tự làm bởi agent):**
> 1. Tạo NeonDB free → chạy `npm run db:init` (hoặc paste `db/schema.sql` vào SQL Editor của Neon).
> 2. Tạo `GEMINI_API_KEY` bằng Google AI Studio, đặt `GEMINI_MODEL` (VD `gemini-2.0-flash`), điền vào `.env.local` và Vercel.


### Luồng mới (sau Bước 6) — Trang chủ / Chọn bài học / Lab theo bài học
- [x] `lib/lessons.ts` — danh mục khối lớp 8/9 (chỉ môn Hóa học), 6 bài học hh8-1..3, hh9-1..3, mỗi bài có `defaultPairs` (task chips SGK, gồm cả cặp không phản ứng và cặp AI zn+agno3); tiền tố nội dung tĩnh `static:`.
- [x] `lib/content.ts` + bảng `lesson_content` trong `db/schema.sql` — lưu nội dung bài học (title/note/pairs) dạng JSONB, API `GET/POST /api/lessons/[id]/content` và `/import` (file ≤500KB .txt/.md/.json/.csv → Gemini generateLessonContent → validate → lưu DB).
- [x] Trang `/` (Trang chủ mới): hero minh họa cốc 2D + Sparkles, hướng dẫn 5 bước "Nhà Giả Kim Nhí", banner an toàn (#b3402a), gate đăng nhập = NicknameDialog; đã đăng nhập → nút Tiếp tục sang `/hoc`.
- [x] Trang `/hoc`: stepper 4 bước Khối lớp → Môn (Hóa học active, Vật lý/Toán 🔒 sắp ra mắt) → Bài học (fetch `/api/lessons`) → Nội dung ("SGK sẵn có" = `static:<lessonId>` hoặc danh sách nội dung đã lưu từ DB (tự chịu 503 khi thiếu DATABASE_URL) hoặc nhập file upload). Nút "Vào Lab" → `/lab?lesson=<id>&content=<cid>`.
- [x] Trang `/lab` (trang lab cũ dời sang đây, `useSearchParams` bọc Suspense): đọc query `lesson`+`content`; `static:` dùng `defaultPairs`, còn lại fetch `GET /api/lessons/<id>/content?cid=` → payload; LessonTaskCard hiển thị task chips + trạng thái done (Set pairKey); header có "📚 Đổi bài học", nút về trang chủ, sound, badge, sổ tay; task chip click → chọn sẵn 2 hóa chất trên kệ.
- [x] `npm run build` xanh, đã smoke-test runtime: `/`, `/hoc`, `/lab`, `/api/lessons` = 200; `/api/notebook` = 503 khi chưa có DATABASE_URL (graceful như thiết kế); lưu ý PowerShell: lần build song song dev server làm hỏng `.next` → luôn xóa `.next` trước khi restart dev.

## 17. Kịch bản demo 3 phút (Bước 7)

1. **0:00–0:40 — Trung hoà:** chọn HCl + NaOH → bấm "Thực hiện thí nghiệm". Nhấn mạnh: cốc ấm lên (tỏa nhiệt) và phương trình ion rút gọn `H⁺ + OH⁻ → H2O`.
2. **0:40–1:20 — Kết tủa xanh:** CuSO4 (dung dịch xanh) + NaOH → kết tủa xanh lam Cu(OH)2 rơi và nén thành cặn. Chỉ 2 giây mà cả lớp hiểu "kết tủa" là gì.
3. **1:20–1:50 — Sủi bọt:** Na2CO3 + HCl → bọt khí CO2. Kéo quiz về khí CO2 làm đục nước vôi trong.
4. **1:50–2:30 — Cặp lạ qua AI:** Zn + AgNO3 (không có trong dữ liệu) → loader "Đang quan sát..." → AI phân tích; chạy lại lần 2 để thấy phản hồi tức thì nhờ cache.
5. **2:30–3:00 — Sổ tay + danh hiệu:** nhập biệt danh → các phản ứng đã thí nghiệm nằm trong Sổ tay, huy hiệu nhảy theo ngưỡng 5/10; nhấn "Làm sạch cốc" để quay lại và thí nghiệm tiếp.

> Trước demo: chạy `npm run warm-cache http://localhost:3000` (hoặc URL production) để nạp sẵn cache.


## 16. Hướng mở rộng (sau demo, KHÔNG làm bây giờ)

- Chất chỉ thị (quỳ tím, phenolphtalein) và thí nghiệm chuẩn độ.
- Đèn cồn, thêm nước, đo pH.
- Kéo thả hóa chất.
- Bảng xếp hạng nhiều người dùng, đăng nhập.
- Chế độ giáo viên giao bài thí nghiệm.
