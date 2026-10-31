"use client";

import { useState } from "react";

interface QuizCardProps {
  question: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
}

const LETTERS = ["A", "B", "C"];
const LETTER_TONE = ["bg-coral", "bg-teal-soft", "bg-mustard"];

export function QuizCard({
  question,
  options,
  correctIndex,
  explanation,
}: QuizCardProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;
  const isCorrect = chosen === correctIndex;

  return (
    <div className="card-sticker p-4">
      <p className="font-display mb-3 text-xs font-extrabold uppercase tracking-widest text-terracotta">
        Câu hỏi nhỏ 🎯
      </p>
      <p className="mb-3 text-sm font-bold text-ink">{question}</p>
      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) => {
          let tone = "bg-paper text-ink";
          if (answered) {
            if (i === correctIndex) {
              tone = "bg-teal-soft text-ink";
            } else if (i === chosen) {
              tone = "text-[#8a2c1d]";
            } else {
              tone = "bg-transparent text-ink-soft opacity-60";
            }
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setChosen(i)}
              className={`sticker-flat flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-transform disabled:cursor-default hover:-translate-y-0.5 ${tone}`}
              style={
                answered
                  ? i === correctIndex
                    ? { borderColor: "#2e7d5b" }
                    : i === chosen
                      ? { borderColor: "#b3402a", borderStyle: "solid" }
                      : undefined
                  : undefined
              }
            >
              <span
                className={`sticker-chip flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs font-extrabold text-ink ${LETTER_TONE[i]}`}
              >
                {LETTERS[i]}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className={`sticker-flat mt-3 px-3 py-2 text-sm ${
            isCorrect ? "bg-teal-soft text-ink" : "text-[#8a2c1d]"
          }`}
          style={isCorrect ? undefined : { borderColor: "#b3402a" }}
        >
          <span className="font-display font-extrabold">
            {isCorrect ? "Chính xác! 🎉 " : "Chưa đúng. "}
          </span>
          {explanation}
        </div>
      )}
    </div>
  );
}
