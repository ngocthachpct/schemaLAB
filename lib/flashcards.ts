import { z } from "zod";
import { pairKey } from "./pairKey";
import { getLesson } from "./lessons";
import { getLessonTheory } from "./theory";
import { getReagent } from "./reagents";
import type { ReactionResult } from "./schema";
import reactions from "./reactions.json";

export const FlashCardSchema = z.object({
  id: z.string(),
  front: z.string().min(1).max(280),
  back: z.string().min(1).max(500),
  tag: z.string().max(40).optional(),
});

export type FlashCard = z.infer<typeof FlashCardSchema>;

const reactionMap = reactions as Record<string, ReactionResult>;

function cardsFromTheory(lessonId: string): FlashCard[] {
  const theory = getLessonTheory(lessonId);
  if (!theory) return [];
  const cards: FlashCard[] = theory.remember.map((line, i) => ({
    id: `${lessonId}-r${i}`,
    front: `Ghi nhớ #${i + 1}: nội dung quan trọng của bài là gì?`,
    back: line,
    tag: "Ghi nhớ",
  }));
  theory.sections.forEach((s, i) => {
    cards.push({
      id: `${lessonId}-s${i}`,
      front: s.heading,
      back: s.body,
      tag: "Lý thuyết",
    });
  });
  return cards;
}

function cardsFromPairs(pairs: readonly (readonly [string, string])[]): FlashCard[] {
  const cards: FlashCard[] = [];
  for (const [a, b] of pairs) {
    const key = pairKey(a, b);
    const ra = getReagent(a);
    const rb = getReagent(b);
    const result = reactionMap[key];
    if (!ra || !rb) continue;

    if (result) {
      cards.push({
        id: `eq-${key}`,
        front: `Phương trình khi trộn ${ra.formula} với ${rb.formula}?`,
        back: result.has_reaction
          ? result.equation +
            (result.ionic_equation ? `\nIon rút gọn: ${result.ionic_equation}` : "")
          : "Không có phản ứng đáng kể ở điều kiện phòng.",
        tag: "Phương trình",
      });
      if (result.quiz) {
        cards.push({
          id: `qz-${key}`,
          front: result.quiz.question,
          back: `${result.quiz.options[result.quiz.correct_index]}\n(${result.quiz.explanation})`,
          tag: "Quiz",
        });
      }
    } else {
      cards.push({
        id: `ask-${key}`,
        front: `Dự đoán: ${ra.nameVi} (${ra.formula}) + ${rb.nameVi} (${rb.formula})?`,
        back: "Cặp này chưa có trong SGK sẵn — hãy thử trong Phòng thí nghiệm để AI phân tích!",
        tag: "Thử thách",
      });
    }
  }
  return cards;
}

/**
 * Build a flashcard deck for a lesson.
 * - Static SGK: theory remember/sections + reaction cards from defaultPairs
 * - Custom pairs (imported content): cards from those pairs (+ theory if available)
 */
export function buildFlashcards(
  lessonId: string,
  pairs?: readonly (readonly [string, string] | { a: string; b: string })[]
): FlashCard[] {
  const lesson = getLesson(lessonId);
  const normalized: readonly (readonly [string, string])[] = pairs
    ? pairs.map((p) => ("a" in p ? ([p.a, p.b] as const) : p))
    : (lesson?.defaultPairs ?? []);

  const seen = new Set<string>();
  const deck: FlashCard[] = [];
  for (const card of [...cardsFromTheory(lessonId), ...cardsFromPairs(normalized)]) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    const parsed = FlashCardSchema.safeParse(card);
    if (parsed.success) deck.push(parsed.data);
  }
  return deck;
}
