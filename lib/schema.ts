import { z } from "zod";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ReactionResultSchema = z.object({
  has_reaction: z.boolean(),
  reaction_type: z.enum([
    "trao_doi",
    "the",
    "trung_hoa",
    "phan_huy",
    "khong_phan_ung",
  ]),
  equation: z.string(), // "CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4"
  ionic_equation: z.string().nullable(), // "Cu²⁺ + 2OH⁻ → Cu(OH)₂↓"
  visual_effects: z.object({
    final_liquid_color: hex,
    has_gas: z.boolean(),
    gas_color: hex.nullable(),
    has_precipitate: z.boolean(),
    precipitate_color: hex.nullable(),
    heat_level: z.enum(["normal", "exothermic", "endothermic"]),
  }),
  explanation: z.string(), // 2 câu, dễ hiểu cho HS THCS
  safety_note: z.string().nullable(),
  quiz: z
    .object({
      question: z.string(), // "Vì sao xuất hiện kết tủa?"
      options: z.array(z.string()).length(3),
      correct_index: z.number().int().min(0).max(2),
      explanation: z.string(),
    })
    .nullable(),
});

export type ReactionResult = z.infer<typeof ReactionResultSchema>;

/** Extra consistency rules beyond the base schema */
export function validateReactionResult(r: ReactionResult): string | null {
  if (!r.has_reaction) {
    if (r.visual_effects.has_precipitate || r.visual_effects.has_gas) {
      return "has_reaction=false nhưng vẫn có khí/kết tủa";
    }
  }
  return null;
}

export type ReactResponse =
  | {
      source: "local" | "cache" | "ai";
      key: string;
      result: ReactionResult;
    }
  | { error: "fallback"; message: string };
