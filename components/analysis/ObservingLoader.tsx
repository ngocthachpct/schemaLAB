"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ObservingLoader() {
  const reduce = useReducedMotion();
  return (
    <div
      className="sticker-flat flex items-center gap-3 bg-mustard px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <motion.svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        animate={reduce ? undefined : { rotate: [-8, 8, -8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "50% 90%" }}
        aria-hidden
      >
        {/* Test tube */}
        <rect x="13" y="4" width="8" height="22" rx="4" fill="none" stroke="#2f2a26" strokeWidth="2" />
        <path d="M13 20 Q17 24 21 20 L21 22 A4 4 0 0 1 13 22 Z" fill="#3f9e8d" />
        <rect x="14.5" y="2" width="5" height="4" rx="1" fill="#e07a5f" stroke="#2f2a26" strokeWidth="1.4" />
      </motion.svg>
      <span className="text-sm font-bold text-ink">
        Đang quan sát thí nghiệm...
      </span>
    </div>
  );
}
