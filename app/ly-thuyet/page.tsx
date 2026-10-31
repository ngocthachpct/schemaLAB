"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getLesson, isStaticContent } from "@/lib/lessons";
import { getLessonTheory } from "@/lib/theory";
import type { LessonPayload, TheoryBlock } from "@/lib/content";
import { Sparkle } from "@/components/decor/Sparkle";
import { ModeSwitchNav } from "@/components/study/ModeSwitchNav";
import { WaveLoading } from "@/components/ui/WaveLoading";
import { getReagent } from "@/lib/reagents";

export default function TheoryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <WaveLoading text="Loading..." />
        </main>
      }
    >
      <TheoryClient />
    </Suspense>
  );
}

function TheoryClient() {
  const params = useSearchParams();
  const lessonId = params.get("lesson");
  const contentId = params.get("content");
  const lesson = getLesson(lessonId);
  const staticTheory = getLessonTheory(lessonId);
  const isMineOnly = Boolean(contentId && !isStaticContent(contentId) && !lesson);

  const [payload, setPayload] = useState<LessonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStaticContent(contentId) && lesson) {
      setPayload({
        kind: "theory",
        title: lesson.title,
        note: lesson.description,
        pairs: lesson.defaultPairs.map(([a, b]) => ({ a, b })),
        theory: staticTheory
          ? {
              summary: staticTheory.summary,
              sections: staticTheory.sections,
              remember: [...staticTheory.remember],
            }
          : undefined,
      });
      setError(null);
      setLoading(false);
      return;
    }

    if (!contentId || isStaticContent(contentId)) {
      setError("Thiếu nội dung. Quay lại trang học để chọn bài nhé!");
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
          setError("Em cần đăng nhập để xem bài của mình.");
        } else {
          setError("Không tải được nội dung bài học.");
        }
      } catch {
        if (!cancelled) setError("Lỗi mạng khi tải nội dung.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lesson, contentId, staticTheory, isMineOnly]);

  if (!lesson && !contentId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-4 p-4">
        <p className="font-medium text-ink-soft">Không tìm thấy bài học.</p>
        <Link href="/hoc" className="sticker-btn w-fit bg-mustard px-4 py-2 text-sm text-ink">
          ← Về chọn bài
        </Link>
      </main>
    );
  }

  const theory: TheoryBlock | null = payload?.theory ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col gap-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <Link href="/hoc" className="sticker-btn bg-paper px-3 py-1.5 text-xs text-ink">
          ← Đổi bài
        </Link>
        <ModeSwitchNav
          current="theory"
          contentId={contentId}
          lessonId={lesson?.id ?? null}
        />
        <Sparkle tone="#3f9e8d" size={16} delay="0.2s" />
      </header>

      <div className="card-sticker p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-teal">Học lý thuyết</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
          {payload?.title ?? lesson?.title ?? "Bài của tôi"}
        </h1>
        <p className="mt-2 text-sm font-medium text-ink-soft">
          {payload?.note ?? lesson?.description ?? ""}
        </p>
      </div>

      {loading && <WaveLoading text="Loading..." />}

      {error && (
        <div className="sticker-flat border-[#b3402a] bg-[#fde2d8] px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      {!loading && theory ? (
        <>
          <section className="card-sticker space-y-3 p-5">
            <h2 className="font-display text-lg font-extrabold text-ink">Tóm tắt bài</h2>
            <p className="text-sm leading-relaxed text-ink">{theory.summary}</p>
          </section>
          {theory.sections.map((s) => (
            <section key={s.heading} className="card-sticker space-y-2 p-5">
              <h2 className="font-display text-lg font-extrabold text-ink">{s.heading}</h2>
              <p className="text-sm leading-relaxed text-ink">{s.body}</p>
              {s.tip && (
                <p className="sticker-flat bg-mustard/40 px-3 py-2 text-xs font-semibold text-ink">
                  💡 {s.tip}
                </p>
              )}
            </section>
          ))}
          <section className="card-sticker space-y-3 p-5">
            <h2 className="font-display text-lg font-extrabold text-ink">Cần nhớ</h2>
            <ul className="flex flex-col gap-2">
              {theory.remember.map((line) => (
                <li
                  key={line}
                  className="sticker-flat bg-teal-soft px-3 py-2 text-sm font-semibold text-ink"
                >
                  ✓ {line}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        !loading &&
        !error && (
          <section className="card-sticker p-5 text-sm text-ink-soft">
            Bộ nội dung này chưa có khối lý thuyết. Import file với chế độ Học Bài hoặc chọn SGK.
          </section>
        )
      )}

      {!loading && payload && payload.pairs.length > 0 && (
        <section className="card-sticker space-y-3 p-5">
          <h2 className="font-display text-lg font-extrabold text-ink">Thí nghiệm gắn với bài</h2>
          <div className="flex flex-col gap-2">
            {payload.pairs.map((p) => {
              const a = getReagent(p.a);
              const b = getReagent(p.b);
              return (
                <div
                  key={`${p.a}+${p.b}`}
                  className="sticker-flat flex flex-wrap items-center gap-2 bg-paper px-3 py-2 text-sm font-semibold"
                >
                  <span>{a ? `${a.formula} (${a.nameVi})` : p.a}</span>
                  <span className="text-ink-soft">+</span>
                  <span>{b ? `${b.formula} (${b.nameVi})` : p.b}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
