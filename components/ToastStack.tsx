"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface ToastItem {
  id: number;
  message: string;
  tone?: "info" | "error";
}

interface ToastStackProps {
  items: readonly ToastItem[];
  onClose: (id: number) => void;
}

export function ToastStack({ items, onClose }: ToastStackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2.5 px-4">
      <AnimatePresence>
        {items.map((t) => (
          <ToastRow key={t.id} toast={t} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastRow({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const isError = toast.tone === "error";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95, rotate: -2 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`sticker-flat pointer-events-auto max-w-md cursor-pointer px-4 py-2.5 text-sm font-bold text-ink ${
        isError ? "text-[#8a2c1d]" : ""
      }`}
      style={{ backgroundColor: isError ? "#fde2d8" : "#d9efe7" }}
      onClick={() => onClose(toast.id)}
      role="status"
    >
      <span aria-hidden>{isError ? "⚠️ " : "🔓 "}</span>
      {toast.message}
    </motion.div>
  );
}
