"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface NotebookEntry {
  pair_key: string;
  equation: string;
  discovered_at: string;
}

export interface NotebookDrawerHandle {
  /** present for API stability; no imperative methods used yet */
  __brand: never;
}

interface NotebookDrawerProps {
  open: boolean;
  onClose: () => void;
  reactions: readonly NotebookEntry[];
  count: number;
  badgeLabel: string;
  hasName: boolean;
  onRequireName: () => void;
}

export const NotebookDrawer = function NotebookDrawerImpl({
  open,
  onClose,
  reactions,
  count,
  badgeLabel,
  hasName,
  onRequireName,
}: NotebookDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-label="Sổ tay thí nghiệm"
            className="mx-auto fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-t-3xl p-5"
            style={{
              backgroundColor: "#fffdf6",
              borderTop: "3px solid var(--color-ink)",
              boxShadow: "0 -6px 0 0 rgba(47,42,38,0.25)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
          >
            {/* Retro punched holes for the "notebook" feel */}
            <div aria-hidden className="absolute inset-x-0 top-2 flex justify-center gap-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)", background: "#e8dcc3" }}
                />
              ))}
            </div>

            <div className="mb-3 mt-2 flex items-center gap-2.5">
              <h2 className="font-display text-lg font-extrabold text-ink">
                📖 Sổ tay thí nghiệm
              </h2>
              <span className="sticker-chip bg-teal-soft px-2.5 py-0.5 text-xs text-ink">
                {count} phản ứng
              </span>
              <span className="sticker-chip bg-mustard px-2.5 py-0.5 text-xs text-ink rot-neg">
                🏅 {badgeLabel}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng sổ tay"
                className="sticker-btn ml-auto bg-paper px-2 py-1 text-sm text-ink"
              >
                ✕
              </button>
            </div>

            {!hasName && (
              <div className="sticker-flat mb-3 flex items-center gap-2 bg-teal-soft px-3 py-2 text-sm text-ink">
                <span className="flex-1 font-semibold">
                  Nhập biệt danh để lưu phản ứng của em nhé!
                </span>
                <button
                  type="button"
                  onClick={onRequireName}
                  className="sticker-btn bg-terracotta px-3 py-1.5 text-xs text-white"
                >
                  Nhập biệt danh
                </button>
              </div>
            )}

            {reactions.length === 0 ? (
              <div className="dashed-frame flex-1 overflow-y-auto p-6 text-center text-sm font-medium text-ink-soft">
                Chưa có phản ứng nào. Hãy thực hiện thí nghiệm để ghi vào đây!
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto pt-1">
                {reactions.map((r, i) => (
                  <li
                    key={r.pair_key}
                    className={`sticker-flat mb-2.5 bg-paper px-3 py-2 ${
                      i % 2 === 0 ? "rot-neg" : "rot-pos"
                    }`}
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-ink-soft">
                      {r.pair_key}
                    </div>
                    <div className="text-sm font-semibold text-ink">{r.equation}</div>
                    <div className="mt-0.5 text-[11px] font-medium text-ink-soft">
                      {new Date(r.discovered_at).toLocaleString("vi-VN")}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-2 text-center text-[11px] font-semibold text-ink-soft">
              Danh hiệu: ≥5 → Nhà nghiên cứu, ≥10 → Bậc thầy Hóa học
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
