"use client";

import { motion } from "framer-motion";
import type { ReactionResult } from "@/lib/schema";
import type { Reagent } from "@/lib/reagents";
import { Equation } from "./Equation";
import { QuizCard } from "./QuizCard";
import { ObservingLoader } from "./ObservingLoader";

export interface Analysis {
  a: Reagent;
  b: Reagent;
  result: ReactionResult | null;
  source: "local" | "cache" | "ai";
  /** Soft failure message (AI unavailable etc.) */
  message?: string;
  /** New reaction discovered => show unlock chip */
  isNew?: boolean;
}

export const REACTION_TYPE_VI: Record<ReactionResult["reaction_type"], string> =
  {
    trao_doi: "Phản ứng trao đổi",
    the: "Phản ứng thế",
    trung_hoa: "Phản ứng trung hoà",
    phan_huy: "Phản ứng phân huỷ",
    khong_phan_ung: "Không có phản ứng",
  };

interface AnalysisPanelProps {
  analysis: Analysis | null;
  loading: boolean;
}

function Block({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* Retro-toned chips for each reaction type */
const TYPE_CHIP_TONE: Record<ReactionResult["reaction_type"], string> = {
  trao_doi: "bg-mustard text-ink rot-neg",
  the: "bg-coral text-ink rot-pos",
  trung_hoa: "bg-teal-soft text-ink rot-neg",
  phan_huy: "bg-lilac text-ink rot-pos",
  khong_phan_ung: "bg-paper-deep text-ink-soft",
};

export function AnalysisPanel({ analysis, loading }: AnalysisPanelProps) {
  const r = analysis?.result ?? null;
  let delay = 0;
  const next = (): number => (delay += 0.25);

  return (
    <section
      aria-label="Bảng phân tích"
      className="card-sticker flex h-full flex-col gap-3 overflow-y-auto p-4"
      style={{ backgroundColor: "#fffdf6" }}
    >
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-extrabold text-ink">
          Bảng<span className="text-teal"> phân tích</span>
        </h2>
        <span className="sticker-chip ml-auto bg-paper-deep px-2 py-0.5 text-[10px] text-ink-soft">
          🔬 Kết quả
        </span>
      </div>

      {loading && <ObservingLoader />}

      {!analysis && !loading && (
        <div className="dashed-frame p-4 text-sm font-medium text-ink-soft">
          Chọn 2 hóa chất trên kệ rồi bấm
          <span className="font-display font-bold text-terracotta">
            {" "}
            Thực hiện thí nghiệm
          </span>
          . Với mỗi chất bạn sẽ thấy: hiện tượng, phương trình, giải thích và
          một câu hỏi nhỏ.
        </div>
      )}

      {/* Soft error (AI fallback): friendly message + suggested pairs */}
      {analysis && analysis.message && !r && (
        <Block delay={0}>
          <div className="sticker-flat bg-paper-deep px-4 py-3 text-sm text-ink">
            <p className="font-display font-extrabold">Ôi, có chút trục trặc!</p>
            <p>{analysis.message}</p>
            <p className="mt-1">
              Gợi ý: thử trộn <b>CuSO4 + NaOH</b>, <b>Na2CO3 + HCl</b> hoặc{" "}
              <b>Zn + CuSO4</b>.
            </p>
          </div>
        </Block>
      )}

      {r && analysis && (
        <div className="flex flex-col gap-3.5">
          {/* 1. Reaction type chip */}
          <Block delay={next()}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`sticker-chip px-3 py-1 text-xs ${TYPE_CHIP_TONE[r.reaction_type]}`}
              >
                {REACTION_TYPE_VI[r.reaction_type]}
              </span>
              <span className="text-xs font-semibold text-ink-soft">
                {analysis.a.formula} + {analysis.b.formula}
                {analysis.isNew && (
                  <span className="sticker-chip ml-2 bg-mustard px-2 py-0.5 text-[10px] text-ink rot-neg">
                    Mới!
                  </span>
                )}
              </span>
            </div>
          </Block>

          {/* 2. Full equation */}
          <Block delay={next()}>
            {r.has_reaction ? (
              <div className="sticker-flat bg-paper-deep p-3">
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-ink-soft">
                  Phương trình hóa học
                </p>
                <Equation value={r.equation} className="text-sm text-ink" />
              </div>
            ) : (
              <div className="sticker-flat bg-paper-deep p-3 text-sm font-medium text-ink-soft">
                Không xảy ra phản ứng hóa học nên không có phương trình.
              </div>
            )}
          </Block>

          {/* 3. Net ionic equation */}
          {r.ionic_equation && (
            <Block delay={next()}>
              <div className="sticker-flat bg-paper-deep p-3">
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-ink-soft">
                  Phương trình ion rút gọn
                </p>
                <Equation value={r.ionic_equation} className="text-sm text-ink" />
              </div>
            </Block>
          )}

          {/* 4. Explanation */}
          <Block delay={next()}>
            <div className="sticker-flat p-3">
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-ink-soft">
                Giải thích bản chất
              </p>
              <p className="text-sm font-medium leading-relaxed text-ink">
                {r.explanation}
              </p>
            </div>
          </Block>

          {/* 5. Safety warning (retro danger stamp) */}
          {r.safety_note && (
            <Block delay={next()}>
              <div
                className="sticker-flat px-3 py-3"
                style={{ backgroundColor: "#fde2d8", borderColor: "#b3402a" }}
              >
                <p className="font-display flex items-center gap-2 text-sm font-extrabold text-[#b3402a]">
                  <span aria-hidden>⚠️</span> Cảnh báo an toàn
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-[#8a2c1d]">
                  {r.safety_note}
                </p>
                <p className="mt-1 text-xs font-bold text-[#b3402a]">
                  Hóa chất ảo là để học — tuyệt đối không tự làm thí nghiệm này
                  ngoài đời!
                </p>
              </div>
            </Block>
          )}

          {/* 6. Quiz */}
          {r.quiz && (
            <Block delay={next()}>
              <QuizCard
                question={r.quiz.question}
                options={r.quiz.options}
                correctIndex={r.quiz.correct_index}
                explanation={r.quiz.explanation}
              />
            </Block>
          )}
        </div>
      )}
    </section>
  );
}
