"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { badgeForCount } from "@/lib/badges";
import type { ToastItem } from "@/components/ToastStack";

const STORAGE_KEY = "chemlab.nickname";
const GUEST_NAME = "Khách";

export interface SavedReaction {
  pair_key: string;
  equation: string;
  discovered_at: string;
}

/**
 * Client-side notebook state: nickname (localStorage) + server sync.
 * All persistence lives in the "discovered_reactions" table; the badge
 * is computed from COUNT(*) (spec section 5.4/5.5).
 */
export function useNotebook() {
  const [nickname, setNicknameState] = useState<string>("");
  const [savedReactions, setSavedReactions] = useState<SavedReaction[]>([]);
  const [count, setCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(1);
  const nameRef = useRef("");
  const hydrated = useRef(false);

  // Hydrate nickname from localStorage (client only)
  useEffect(() => {
    let stored = "";
    try {
      stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      stored = "";
    }
    setNicknameState(stored);
    nameRef.current = stored;
    hydrated.current = true;
    if (stored) void refresh(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastItem["tone"] = "info") => {
      const id = toastId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
    },
    []
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refresh = useCallback(async (name: string): Promise<void> => {
    if (!name) return;
    try {
      const res = await fetch(
        `/api/notebook?name=${encodeURIComponent(name)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "reactions" in data &&
        Array.isArray((data as { reactions: unknown }).reactions)
      ) {
        const d = data as { reactions: SavedReaction[]; count: number };
        setSavedReactions(d.reactions);
        setCount(d.count);
      }
    } catch {
      // offline / db down: keep current state
    }
  }, []);

  const setNickname = useCallback(
    (name: string): void => {
      const clean = name.trim().slice(0, 40);
      setNicknameState(clean);
      nameRef.current = clean;
      try {
        window.localStorage.setItem(STORAGE_KEY, clean);
      } catch {
        // private mode: keep in memory only
      }
      void refresh(clean);
      pushToast("Đã lưu biệt danh, tiếp tục thí nghiệm nào!");
    },
    [refresh, pushToast]
  );

  /** Called when an experiment result with a reaction is revealed. */
  const record = useCallback(
    async (key: string): Promise<void> => {
      const name = nameRef.current || GUEST_NAME;
      try {
        const res = await fetch("/api/notebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, key }),
        });
        if (!res.ok) {
          pushToast("Không lưu được vào Sổ tay, thử lại nhé!", "error");
          return;
        }
        const data = (await res.json()) as { count: number; isNew: boolean };
        setCount(data.count);
        if (data.isNew) {
          pushToast("🔓 Mở khóa phản ứng mới!");
          if (nameRef.current) void refresh(nameRef.current);
        }
      } catch {
        pushToast("Không lưu được vào Sổ tay, thử lại nhé!", "error");
      }
    },
    [refresh, pushToast]
  );

  const badgeLabel = badgeForCount(count);

  return {
    nickname,
    hasName: nickname.length > 0,
    savedReactions,
    count,
    badgeLabel,
    toasts,
    pushToast,
    dismissToast,
    setNickname,
    record,
    refresh,
  };
}
