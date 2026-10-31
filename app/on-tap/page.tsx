"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getLesson, isStaticContent } from "@/lib/lessons";
import { buildFlashcards, type FlashCard } from "@/lib/flashcards";
import type { LessonPayload } from "@/lib/content";
import { FlashCardDeck } from "@/components/study/FlashCardDeck";
import { ModeSwitchNav } from "@/components/study/ModeSwitchNav";
import { Sparkle } from "@/components/decor/Sparkle";
import { WaveLoading } from "@/components/ui/WaveLoading";

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <WaveLoading text="Loading..." />
        </main>
      }
    >
      <ReviewClient />
    </Suspense>
  );
}

function ReviewClient() {
  const params = useSearchParams();
  const lessonId = params.get("lesson");
  const contentId = params.get("content");
  const lesson = getLesson(lessonId);

  const [payload, setPayload] = useState<LessonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStaticContent(contentId) && lesson) {
      setPayload({
        kind: "flashcards",
        title: lesson.title,
        note: lesson.description,
        pairs: lesson.defaultPairs.map(([a, b]) => ({ a, b })),
      });
      setError(null);
      setLoading(false);
      return;
    }

    if (!contentId || isStaticContent(contentId)) {
      if (lesson) {
        setPayload({
          kind: "flashcards",
          title: lesson.title,
          note: lesson.description,
          pairs: lesson.defaultPairs.map(([a, b]) => ({ a, b })),
        });
        setError(null);
      } else {
        setError("Thiếu nội dung flash card.");
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const url = lesson
          ? `/api/lessons/${lesson.id}/content?cid=${encodeURIComponent(contentId)}`
          : `/api/my-contents/${encodeURIComponent(contentId)}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = (await res.json()) as { content?: { payload: LessonPayload } };
        if (cancelled) return;
        if (res.ok && data.content?.payload) {
          setPayload(data.content.payload);
          setError(null);
        } else if (res.status === 401) {
          setError("Em cần đăng nhập để xem flash card của mình.");
        } else {
          setError("Không tải được nội dung để ôn flash card.");
        }
      } catch {
        if (!cancelled) setError("Lỗi mạng khi tải flash card.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lesson, contentId]);

  const cards: FlashCard[] = useMemo(() => {
    if (payload?.cards && payload.cards.length > 0) {
      return payload.cards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        tag: c.tag,
      }));
    }
    if (lesson) return buildFlashcards(lesson.id, payload?.pairs);
    return [];
  }, [lesson, payload]);

  const fromDb = Boolean(payload?.cards && payload.cards.length > 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <Link href="/hoc" className="sticker-btn bg-paper px-3 py-1.5 text-xs text-ink">
          ← Đổi bài
        </Link>
        <ModeSwitchNav
          current="review"
          contentId={contentId}
          lessonId={lesson?.id ?? null}
        />
        <Sparkle tone="#f2c14e" size={16} delay="0.3s" />
      </header>

      <div className="card-sticker p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-terracotta">Ôn tập</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
          Flash card — {payload?.title ?? lesson?.title ?? "Bài của tôi"}
        </h1>
        <p className="mt-2 text-sm font-medium text-ink-soft">
          {fromDb
            ? "Bộ thẻ đã lưu trong DB — hỏi–đáp bám bài học."
            : "Bộ thẻ SGK tạm thời. Tạo bài mới ở mục Bài của tôi để có câu hỏi focus hơn."}
        </p>
      </div>

      {loading && <WaveLoading text="Loading..." />}
      {error && (
        <div className="sticker-flat border-[#b3402a] bg-[#fde2d8] px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="card-sticker p-5">
          <FlashCardDeck cards={cards} />
        </div>
      )}
    </main>
  );
}
