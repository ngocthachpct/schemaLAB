"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface NicknameDialogProps {
  open: boolean;
  initialName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/gu;

export function NicknameDialog({
  open,
  initialName,
  onSave,
  onClose,
}: NicknameDialogProps) {
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const submit = (): void => {
    const name = value.replace(CONTROL_CHARS, "").trim().slice(0, 40);
    if (name.length < 1) {
      setError("Biệt danh cần ít nhất 1 ký tự nhé!");
      return;
    }
    setError(null);
    onSave(name);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="Nhập biệt danh"
            className="card-sticker w-full max-w-sm p-5"
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            style={{ backgroundColor: "#fffdf6" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-extrabold text-ink">
              👤 Biệt danh của em
            </h2>
            <p className="mt-1 text-sm font-medium text-ink-soft">
              Biệt danh giúp lưu các phản ứng đã khám phá vào Sổ tay, ví dụ:
              &ldquo;Minh&rdquo;.
            </p>
            <input
              className="sticker-flat mt-3 w-full px-3 py-2 text-sm font-semibold text-ink outline-none"
              style={{ borderColor: error ? "#b3402a" : "var(--color-ink)" }}
              value={value}
              maxLength={40}
              placeholder="Nhập biệt danh..."
              autoFocus
              onChange={(e) => {
                setValue(e.target.value);
                setPreview(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            {error && (
              <p className="mt-2 text-xs font-bold text-[#b3402a]">{error}</p>
            )}
            <div className="mt-4 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreview(true)}
                className="sticker-btn bg-paper px-3 py-1.5 text-xs text-ink-soft"
              >
                Xem trước
              </button>
              <button
                type="button"
                onClick={submit}
                className="sticker-btn bg-terracotta px-4 py-1.5 text-xs text-white"
              >
                Lưu biệt danh
              </button>
            </div>
            {preview && (
              <div className="sticker-flat mt-3 bg-teal-soft px-3 py-2 text-sm text-ink">
                Xin chào,{" "}
                <b className="font-display">
                  {value.replace(CONTROL_CHARS, "").trim().slice(0, 40) || "Khách"}
                </b>
                !
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
