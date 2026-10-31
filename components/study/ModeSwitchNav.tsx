"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isStaticContent } from "@/lib/lessons";
import { studyModeToKind, type ContentKind } from "@/lib/content";
import { WaveLoading } from "@/components/ui/WaveLoading";

type StudyMode = "theory" | "review" | "lab";

const MODE_META: Record<
  StudyMode,
  { href: string; label: string; className: string; kind: ContentKind }
> = {
  theory: {
    href: "/ly-thuyet",
    label: "📖 Học lý thuyết",
    className: "sticker-btn bg-teal-soft px-3 py-1.5 text-xs text-ink",
    kind: "theory",
  },
  review: {
    href: "/on-tap",
    label: "🃏 Ôn flash card",
    className: "sticker-btn bg-lilac px-3 py-1.5 text-xs text-ink",
    kind: "flashcards",
  },
  lab: {
    href: "/lab",
    label: "🧪 Vào Lab",
    className: "sticker-btn bg-terracotta px-3 py-1.5 text-xs text-white",
    kind: "lab",
  },
};

interface ModeSwitchNavProps {
  /** Current page mode — that button is hidden */
  current: StudyMode;
  contentId: string | null;
  lessonId: string | null;
}

/**
 * For SGK/static: plain links with same query.
 * For AI-owned content: resolve sibling kind (reuse DB or generate+save) then navigate.
 */
export function ModeSwitchNav({ current, contentId, lessonId }: ModeSwitchNavProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<StudyMode | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const isMine =
    Boolean(contentId) &&
    !isStaticContent(contentId) &&
    /^\d+$/.test(contentId ?? "");

  const sgkQs =
    lessonId && contentId
      ? `lesson=${lessonId}&content=${encodeURIComponent(contentId)}`
      : lessonId
        ? `lesson=${lessonId}&content=${encodeURIComponent(`static:${lessonId}`)}`
        : "";

  const goMine = async (mode: StudyMode): Promise<void> => {
    if (!contentId || !isMine) return;
    setBusy(mode);
    setErr(null);
    try {
      const kind = studyModeToKind(mode);
      const res = await fetch("/api/my-contents/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromId: Number(contentId), kind }),
      });
      const data = (await res.json()) as {
        content?: { id: number };
        message?: string;
        error?: string;
      };
      if (res.ok && data.content?.id) {
        router.push(`${MODE_META[mode].href}?content=${data.content.id}`);
        return;
      }
      setErr(data.message ?? "Chưa chuyển được chế độ này.");
    } catch {
      setErr("Lỗi mạng khi chuyển chế độ.");
    } finally {
      setBusy(null);
    }
  };

  const modes = (Object.keys(MODE_META) as StudyMode[]).filter((m) => m !== current);

  return (
    <>
      {modes.map((mode) => {
        const meta = MODE_META[mode];
        if (!isMine) {
          if (!sgkQs) return null;
          return (
            <Link key={mode} href={`${meta.href}?${sgkQs}`} className={meta.className}>
              {meta.label}
            </Link>
          );
        }
        return (
          <button
            key={mode}
            type="button"
            disabled={busy !== null}
            onClick={() => void goMine(mode)}
            className={`${meta.className} ${busy === mode ? "opacity-60" : ""}`}
          >
            {busy === mode ? "…" : meta.label}
          </button>
        );
      })}
      {busy && <WaveLoading text="Loading..." />}
      {err && (
        <span className="w-full text-[11px] font-semibold text-[#b3402a] sm:w-auto">{err}</span>
      )}
    </>
  );
}
