import { z } from "zod";

/** Study / import mode — maps to lesson_content.kind and payload.kind */
export const ContentKindSchema = z.enum(["lab", "theory", "flashcards"]);
export type ContentKind = z.infer<typeof ContentKindSchema>;

export const GradeSchema = z.enum(["8", "9"]);
export type ContentGrade = z.infer<typeof GradeSchema>;

export const SubjectSchema = z.enum(["chemistry"]);
export type ContentSubject = z.infer<typeof SubjectSchema>;

export const TheoryBlockSchema = z.object({
  summary: z.string().min(1).max(800),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1).max(120),
        body: z.string().min(1).max(1200),
        tip: z.string().max(300).optional(),
      })
    )
    .min(1)
    .max(8),
  remember: z.array(z.string().min(1).max(200)).min(1).max(8),
});

export type TheoryBlock = z.infer<typeof TheoryBlockSchema>;

export const StoredFlashCardSchema = z.object({
  id: z.string().min(1).max(60),
  front: z.string().min(1).max(280),
  back: z.string().min(1).max(500),
  tag: z
    .enum(["Lý thuyết", "Thí nghiệm", "Không phản ứng", "An toàn", "Quiz"])
    .optional(),
});

export type StoredFlashCard = z.infer<typeof StoredFlashCardSchema>;

const PairSchema = z.object({
  a: z.string().min(1).max(40),
  b: z.string().min(1).max(40),
});

/**
 * Payload stored in lesson_content.payload (JSONB).
 * kind decides which fields are required for that import mode.
 * Legacy rows without kind are treated as "lab".
 */
const LessonPayloadObjectSchema = z
  .object({
    kind: ContentKindSchema.default("lab"),
    title: z.string().min(1).max(120),
    note: z.string().max(600),
    pairs: z.array(PairSchema).max(12).default([]),
    theory: TheoryBlockSchema.optional(),
    cards: z.array(StoredFlashCardSchema).max(20).optional(),
    grade: GradeSchema.optional(),
    subject: SubjectSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "lab" && data.pairs.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lab content needs at least 1 reagent pair",
        path: ["pairs"],
      });
    }
    if (data.kind === "theory" && !data.theory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Theory content needs theory block",
        path: ["theory"],
      });
    }
    if (data.kind === "flashcards" && (!data.cards || data.cards.length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Flashcard content needs cards",
        path: ["cards"],
      });
    }
  });

export const LessonPayloadSchema = z.preprocess((raw) => {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && !("kind" in raw)) {
    return { ...(raw as Record<string, unknown>), kind: "lab" };
  }
  return raw;
}, LessonPayloadObjectSchema);

export type LessonPayload = z.infer<typeof LessonPayloadObjectSchema>;

/** Content file metadata row (catalog-linked or list APIs) */
export interface LessonContentMeta {
  id: number;
  lesson_id: string | number | null;
  source: "static" | "ai";
  kind: ContentKind;
  file_name: string | null;
  title: string;
  note: string;
  created_at: string;
  grade?: ContentGrade | null;
  subject?: ContentSubject | null;
}

export const CONTENT_KIND_LABEL_VI: Record<ContentKind, string> = {
  lab: "Thí nghiệm",
  theory: "Lý thuyết",
  flashcards: "Flash card",
};

/** Map UI study mode → stored content kind */
export function studyModeToKind(
  mode: "theory" | "review" | "lab"
): ContentKind {
  if (mode === "review") return "flashcards";
  if (mode === "theory") return "theory";
  return "lab";
}

export interface CustomImportContext {
  grade: ContentGrade;
  subject: ContentSubject;
  kind: ContentKind;
}
