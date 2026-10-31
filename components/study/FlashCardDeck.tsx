"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { FlashCard } from "@/lib/flashcards";

interface FlashCardDeckProps {
  cards: FlashCard[];
}

export function FlashCardDeck({ cards }: FlashCardDeckProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);

  if (cards.length === 0) {
    return (
      <p className="text-sm font-medium text-ink-soft">
        Chưa có flash card cho nội dung này. Thử chọn nội dung SGK hoặc vào Lab trước nhé!
      </p>
    );
  }

  const card = cards[Math.min(index, cards.length - 1)]!;
  const progress = Math.round(((index + (flipped ? 0.5 : 0)) / cards.length) * 100);

  const go = (next: number): void => {
    setFlipped(false);
    setIndex(Math.max(0, Math.min(cards.length - 1, next)));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-soft">
        <span>
          Thẻ {index + 1}/{cards.length}
        </span>
        {card.tag && (
          <span className="sticker-chip bg-mustard px-2 py-0.5 text-[10px] text-ink">
            {card.tag}
          </span>
        )}
        <span className="ml-auto">Đã thuộc: {known}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full border-2 border-ink bg-paper-deep">
        <div
          className="h-full bg-teal transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="relative mx-auto w-full max-w-lg perspective-[1200px]"
        aria-label={flipped ? "Úp thẻ" : "Lật thẻ"}
      >
        <motion.div
          className="relative min-h-[220px] w-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="card-sticker absolute inset-0 flex flex-col justify-center gap-3 bg-paper p-6 text-left"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              Mặt trước — chạm để lật
            </p>
            <p className="font-display text-lg font-extrabold leading-snug text-ink whitespace-pre-wrap">
              {card.front}
            </p>
          </div>
          <div
            className="card-sticker absolute inset-0 flex flex-col justify-center gap-3 bg-teal-soft p-6 text-left"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              Mặt sau — đáp án
            </p>
            <p className="text-base font-semibold leading-relaxed text-ink whitespace-pre-wrap">
              {card.back}
            </p>
          </div>
        </motion.div>
      </button>

      <div className="mx-auto flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className="sticker-btn bg-paper px-4 py-2 text-sm text-ink"
          disabled={index === 0}
          onClick={() => go(index - 1)}
        >
          ← Trước
        </button>
        <button
          type="button"
          className="sticker-btn bg-mustard px-4 py-2 text-sm text-ink"
          onClick={() => setFlipped((f) => !f)}
        >
          {flipped ? "Úp lại" : "Lật thẻ"}
        </button>
        <button
          type="button"
          className="sticker-btn bg-teal-soft px-4 py-2 text-sm text-ink"
          onClick={() => {
            if (flipped) setKnown((k) => k + 1);
            if (index < cards.length - 1) go(index + 1);
          }}
        >
          {index >= cards.length - 1 ? "Xong bộ thẻ" : "Thuộc →"}
        </button>
      </div>
    </div>
  );
}
