import { GoogleGenAI, ApiError } from "@google/genai";
import {
  ReactionResultSchema,
  type ReactionResult,
} from "./schema";
import {
  LessonPayloadSchema,
  type ContentKind,
  type CustomImportContext,
  type LessonPayload,
} from "./content";
import { getReagent } from "./reagents";
import type { Lesson } from "./lessons";
import {
  buildCustomImportPrompt,
  buildImportPrompt,
  buildSiblingKindPrompt,
} from "./prompts/lessonImport";

/**
 * Free-tier–friendly backups (AI Studio Free): Flash-Lite first (~15 RPM / ~500 RPD),
 * then regular Flash (~5 RPM / ~20 RPD) as last resort. Quotas are per model family.
 * @see https://ai.google.dev/gemini-api/docs/rate-limits
 */
const DEFAULT_MODEL_FALLBACKS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
] as const;

/**
 * Primary `GEMINI_MODEL` then `GEMINI_MODEL_FALLBACKS` (comma-separated), then defaults.
 * Deduped, order preserved.
 */
export function getModelChain(): string[] {
  const primary = (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").trim();
  const fromEnv = (process.env.GEMINI_MODEL_FALLBACKS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const chain: string[] = [];
  for (const m of [primary, ...fromEnv, ...DEFAULT_MODEL_FALLBACKS]) {
    if (!m || seen.has(m)) continue;
    seen.add(m);
    chain.push(m);
  }
  return chain;
}

function isRetryableModelError(err: unknown): boolean {
  const status =
    err instanceof ApiError
      ? err.status
      : err && typeof err === "object" && "status" in err
        ? Number((err as { status: unknown }).status)
        : undefined;

  if (status === 429 || status === 503 || status === 404) return true;

  const msg = String(
    err instanceof Error ? err.message : err ?? ""
  ).toLowerCase();

  return (
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("too many requests") ||
    msg.includes("exhausted") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable") ||
    msg.includes("not found") ||
    msg.includes("is not found") ||
    msg.includes("not supported")
  );
}

type GenerateJsonArgs = {
  contents: string;
  temperature?: number;
};

/**
 * Call generateContent trying each model in the chain when rate-limited / quota / model missing.
 */
async function generateJsonWithFallback({
  contents,
  temperature = 0.2,
}: GenerateJsonArgs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình AI (GEMINI_API_KEY).");
  }
  const ai = new GoogleGenAI({ apiKey });
  const models = getModelChain();
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i]!;
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          temperature,
        },
      });
    } catch (err) {
      lastError = err;
      const hasNext = i < models.length - 1;
      if (hasNext && isRetryableModelError(err)) {
        console.warn(
          `[gemini] model="${model}" limited/unavailable → fallback "${models[i + 1]}"`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Tất cả model Gemini đều bị limit hoặc lỗi.");
}

function buildPrompt(aId: string, bId: string): string {
  const a = getReagent(aId)!
  const b = getReagent(bId)!;
  const schemaExample = `{
  "has_reaction": true,
  "reaction_type": "trao_doi|the|trung_hoa|phan_huy|khong_phan_ung",
  "equation": "Chuỗi ký tự, dùng ↓ cho kết tủa, ↑ cho khí",
  "ionic_equation": "chuỗi hoặc null",
  "visual_effects": {
    "final_liquid_color": "#RRGGBB",
    "has_gas": false,
    "gas_color": null,
    "has_precipitate": false,
    "precipitate_color": null,
    "heat_level": "normal|exothermic|endothermic"
  },
  "explanation": "đúng 2 câu tiếng Việt",
  "safety_note": "chuỗi hoặc null",
  "quiz": { "question": "...", "options": ["A","B","C"], "correct_index": 0, "explanation": "..." }
}`;

  return [
    `Bạn là giáo viên Hóa học THCS Việt Nam. Phân tích phản ứng giữa "${a.nameVi} (${a.formula})" và "${b.nameVi} (${b.formula})" ở điều kiện phòng, dung dịch loãng, chương trình THCS.`,
    "",
    "Quy tắc:",
    "- Chỉ dùng kiến thức hóa học chính xác. Nếu không phản ứng, đặt has_reaction=false.",
    "- Phương trình phải cân bằng, dùng ↓ cho kết tủa, ↑ cho khí.",
    "- ionic_equation: phương trình ion rút gọn (dùng ký tự nhỏ trên như ²⁺, ⁻), null nếu không phản ứng.",
    "- Màu HEX phải đúng 6 chữ số dạng #RRGGBB.",
    "- explanation: đúng 2 câu, dễ hiểu cho học sinh lớp 8-9, bằng tiếng Việt.",
    "- safety_note: cảnh báo an toàn ngoài đời thật, null nếu không cần.",
    "- quiz: 1 câu hỏi 3 đáp án về bản chất hiện tượng, null nếu không phản ứng.",
    '- Khi không phản ứng: equation = "", ionic_equation = null, không khí/kết tủa, quiz = null.',
    "Chỉ trả về JSON thuần, đúng schema sau (không thêm chữ nào ngoài JSON):",
    schemaExample,
  ].join("\n");
}

interface GeminiOptions {
  /** Extra instruction for the single retry after a schema failure */
  retryNote?: string;
}

/** Calls Gemini Flash and returns a validated ReactionResult or throws. */
export async function askGemini(
  aId: string,
  bId: string,
  options: GeminiOptions = {}
): Promise<ReactionResult> {
  const contents =
    buildPrompt(aId, bId) + (options.retryNote ? `\n\n${options.retryNote}` : "");

  const response = await generateJsonWithFallback({ contents });

  const raw = response.text ?? "";
  let jsonText = raw.trim();
  // Some models wrap JSON in code fences even with responseMimeType set
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("AI trả về JSON không hợp lệ.");
  }

  const outcome = ReactionResultSchema.safeParse(parsed);
  if (!outcome.success) {
    throw new Error("Kết quả AI không đúng schema.");
  }
  return outcome.data;
}

/** Two attempts total: normal call then one corrective retry (spec section 8). */
export async function askGeminiWithRetry(
  aId: string,
  bId: string
): Promise<ReactionResult> {
  try {
    return await askGemini(aId, bId);
  } catch (firstError) {
    try {
      return await askGemini(aId, bId, {
        retryNote: "Hãy sửa lại để đúng schema. Chỉ trả về JSON thuần.",
      });
    } catch {
      throw firstError;
    }
  }
}

/* ================= Lesson content generation (import flow by kind) ================= */

function sanitizePayload(kind: ContentKind, raw: LessonPayload): LessonPayload {
  const pairs = (raw.pairs ?? []).filter(
    (p) =>
      getReagent(p.a) !== undefined &&
      getReagent(p.b) !== undefined &&
      p.a !== p.b
  );

  if (kind === "lab") {
    if (pairs.length === 0) {
      throw new Error("Tài liệu không tạo thí nghiệm phù hợp với bảng hóa chất hiện có.");
    }
    return { ...raw, kind: "lab", pairs };
  }

  if (kind === "theory") {
    if (!raw.theory) {
      throw new Error("AI không tạo được khối lý thuyết hợp lệ.");
    }
    return { ...raw, kind: "theory", pairs, theory: raw.theory };
  }

  const cards = (raw.cards ?? []).filter((c) => c.front.trim() && c.back.trim());
  if (cards.length === 0) {
    throw new Error("AI không tạo được flash card hợp lệ.");
  }
  return { ...raw, kind: "flashcards", pairs, cards };
}

function parseJsonText(text: string): unknown {
  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  }
  return JSON.parse(jsonText);
}

async function runLessonGeneration(
  contents: string,
  kind: ContentKind,
  meta?: { grade?: LessonPayload["grade"]; subject?: LessonPayload["subject"] }
): Promise<LessonPayload> {
  const parseAndValidate = (text: string): LessonPayload => {
    const parsed = LessonPayloadSchema.parse(parseJsonText(text));
    const cleaned = sanitizePayload(kind, { ...parsed, kind });
    return {
      ...cleaned,
      grade: meta?.grade ?? cleaned.grade,
      subject: meta?.subject ?? cleaned.subject ?? "chemistry",
    };
  };

  const response = await generateJsonWithFallback({ contents });
  try {
    return parseAndValidate(response.text ?? "");
  } catch {
    const res2 = await generateJsonWithFallback({
      contents:
        contents +
        `\n\nHãy sửa lại JSON cho đúng schema kind="${kind}". Chỉ trả về JSON thuần.`,
    });
    return parseAndValidate(res2.text ?? "");
  }
}

/**
 * Catalog-linked import → Gemini → Zod LessonPayload.
 */
export async function generateLessonContent(
  lesson: Lesson,
  fileText: string,
  kind: ContentKind = "lab"
): Promise<LessonPayload> {
  return runLessonGeneration(buildImportPrompt(kind, lesson, fileText), kind, {
    grade: lesson.grade,
    subject: "chemistry",
  });
}

/**
 * Free-standing user import (no catalog lesson_id).
 */
export async function generateCustomLessonContent(
  ctx: CustomImportContext,
  fileText: string
): Promise<LessonPayload> {
  return runLessonGeneration(buildCustomImportPrompt(ctx, fileText), ctx.kind, {
    grade: ctx.grade,
    subject: ctx.subject,
  });
}

/**
 * Create a missing kind from an already-saved payload (same AI lesson / bundle).
 */
export async function generateSiblingKindContent(
  source: LessonPayload,
  targetKind: ContentKind
): Promise<LessonPayload> {
  return runLessonGeneration(
    buildSiblingKindPrompt(targetKind, JSON.stringify(source)),
    targetKind,
    {
      grade: source.grade,
      subject: source.subject ?? "chemistry",
    }
  );
}

/**
 * If source already has the fields needed for targetKind, clone without calling LLM.
 */
export function deriveSiblingWithoutLlm(
  source: LessonPayload,
  targetKind: ContentKind
): LessonPayload | null {
  if (targetKind === "lab" && source.pairs.length >= 1) {
    return {
      kind: "lab",
      title: source.title,
      note: source.note,
      pairs: source.pairs,
      grade: source.grade,
      subject: source.subject ?? "chemistry",
    };
  }
  if (targetKind === "theory" && source.theory) {
    return {
      kind: "theory",
      title: source.title,
      note: source.note,
      pairs: source.pairs,
      theory: source.theory,
      grade: source.grade,
      subject: source.subject ?? "chemistry",
    };
  }
  if (targetKind === "flashcards" && source.cards && source.cards.length > 0) {
    return {
      kind: "flashcards",
      title: source.title,
      note: source.note,
      pairs: source.pairs,
      cards: source.cards,
      grade: source.grade,
      subject: source.subject ?? "chemistry",
    };
  }
  return null;
}
