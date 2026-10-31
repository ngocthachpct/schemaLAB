"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ReagentShelf } from "@/components/shelf/ReagentShelf";
import { LabBench, type ExperimentRun, type AnalysisOutput } from "@/components/lab/LabBench";
import { LessonTaskCard } from "@/components/lab/LessonTaskCard";
import { AnalysisPanel, type Analysis } from "@/components/analysis/AnalysisPanel";
import { BadgeChip } from "@/components/notebook/BadgeChip";
import { NotebookDrawer } from "@/components/notebook/NotebookDrawer";
import { NicknameDialog } from "@/components/NicknameDialog";
import { ToastStack } from "@/components/ToastStack";
import { getReagent } from "@/lib/reagents";
import { pairKey } from "@/lib/pairKey";
import type { ReactionResult, ReactResponse } from "@/lib/schema";
import { useNotebook } from "@/hooks/useNotebook";
import { getLesson, isStaticContent } from "@/lib/lessons";
import type { LessonPayload } from "@/lib/content";
import { ModeSwitchNav } from "@/components/study/ModeSwitchNav";
import { WaveLoading } from "@/components/ui/WaveLoading";

const SOUND_KEY = "chemlab.sound";

export default function LabPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-4">
          <WaveLoading text="Loading..." />
        </main>
      }
    >
      <LabClient />
    </Suspense>
  );
}

function LabClient() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");
  const contentId = searchParams.get("content");
  const lesson = getLesson(lessonId);

  const [selected, setSelected] = useState<string[]>([]);
  const [run, setRun] = useState<ExperimentRun | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [content, setContent] = useState<LessonPayload | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [doneKeys, setDoneKeys] = useState<ReadonlySet<string>>(new Set());

  const runCounter = useRef(1);

  const notebook = useNotebook();

  /* ---------- Load lesson content (SGK static / catalog DB / my-contents) ---------- */
  useEffect(() => {
    const cancelled = { v: false };

    if (isStaticContent(contentId) && lesson) {
      setContent({
        kind: "lab",
        title: lesson.title,
        note: lesson.description,
        pairs: lesson.defaultPairs.map(([a, b]) => ({ a, b })),
      });
      setContentError(null);
      setContentLoading(false);
      return;
    }

    if (contentId && !isStaticContent(contentId)) {
      setContent(null);
      setContentLoading(true);
      void (async () => {
        try {
          const url = lesson
            ? `/api/lessons/${lesson.id}/content?cid=${encodeURIComponent(contentId)}`
            : `/api/my-contents/${encodeURIComponent(contentId)}`;
          const res = await fetch(url, { cache: "no-store" });
          const data = (await res.json()) as unknown as Record<string, unknown>;
          if (cancelled.v) return;
          if (
            res.ok &&
            typeof data === "object" &&
            data !== null &&
            "content" in data
          ) {
            const c = data.content as { payload: LessonPayload };
            setContent(c.payload);
            setContentError(null);
          } else if (res.status === 401) {
            setContentError("Em cần đăng nhập để mở bài thí nghiệm của mình.");
          } else {
            setContentError("Không tải được nội dung của bài học này.");
          }
        } catch {
          if (!cancelled.v) {
            setContentError("Không tải được nội dung của bài học này.");
          }
        } finally {
          if (!cancelled.v) setContentLoading(false);
        }
      })();
      return () => {
        cancelled.v = true;
      };
    }

    return () => {
      cancelled.v = true;
    };
  }, [lesson, contentId]);

  useEffect(() => {
    try {
      setSoundOn(window.localStorage.getItem(SOUND_KEY) !== "0");
    } catch {
      setSoundOn(true);
    }
  }, []);

  /* Request resolution via hybrid engine API (same as before) */
  const requestResult = useCallback(
    async (a: string, b: string): Promise<ReactResponse> => {
      try {
        const res = await fetch("/api/react", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ a, b }),
        });
        if (res.status === 429) {
          return {
            error: "fallback",
            message: "Em hỏi AI hơi nhiều trong một phút rồi, nghỉ chút nhé!",
          };
        }
        if (res.status === 400) {
          return { error: "fallback", message: "Cặp chất không hợp lệ." };
        }
        const data = (await res.json()) as unknown as Record<string, unknown>;
        if (
          typeof data === "object" &&
          data !== null &&
          "result" in data &&
          typeof data.key === "string"
        ) {
          const ok = data as unknown as {
            source: "local" | "cache" | "ai";
            key: string;
            result: ReactionResult;
          };
          return { source: ok.source, key: ok.key, result: ok.result };
        }
        return data as unknown as ReactResponse;
      } catch {
        return {
          error: "fallback",
          message: "Không kết nối được máy chủ, kiểm tra mạng nhé!",
        };
      }
    },
    []
  );

  const handleSelect = (id: string): void => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleRemoveSlot = (slotIndex: number): void => {
    setSelected((prev) => prev.filter((_, i) => i !== slotIndex));
  };

  const handleSubmit = (): void => {
    if (selected.length !== 2) return;
    const a = getReagent(selected[0]);
    const b = getReagent(selected[1]);
    if (!a || !b || a.id === b.id) return;

    setBusy(true);
    setRun({ id: runCounter.current++, a, b });
    setAnalysis(null);
    setPanelLoading(true);
  };

  const handleResult = (out: AnalysisOutput): void => {
    setAnalysis({
      a: out.a,
      b: out.b,
      result: out.result,
      source: out.source,
      message: out.message,
      isNew: out.isNew,
    });
    setPanelLoading(false);
    setBusy(false);
    if (out.result && out.result.has_reaction) {
      const key = pairKey(out.a.id, out.b.id);
      setDoneKeys((prev) => new Set(prev).add(key));
      void notebook.record(key);
    }
  };

  const handleReset = (): void => {
    setRun(null);
    setAnalysis(null);
    setPanelLoading(false);
    setBusy(false);
    setSelected([]);
  };

  const handleHintClick = (a: string, b: string): void => {
    setRun(null);
    setAnalysis(null);
    setPanelLoading(false);
    setBusy(false);
    setSelected([a, b]);
  };

  const nicknameInfo = notebook.hasName
    ? notebook.nickname
    : "Nhập biệt danh để lưu Sổ tay";

  /* ---------- Invalid entry: need lesson catalog OR numeric mine content ---------- */
  const hasMineContent =
    Boolean(contentId) && !isStaticContent(contentId) && /^\d+$/.test(contentId ?? "");
  if (!lesson && !hasMineContent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="card-sticker p-6">
          <p className="font-display text-lg font-extrabold text-ink">
            Bài học không tồn tại đâu! 🤔
          </p>
          <Link href="/hoc" className="sticker-btn mt-4 bg-terracotta px-4 py-2 text-sm text-white">
            Chọn bài học khác
          </Link>
        </div>
      </main>
    );
  }

  const displayTitle = content?.title ?? lesson?.title ?? "Bài của tôi";

  const tasks = (content?.pairs ?? [])
    .map(({ a, b }) => {
      const ra = getReagent(a);
      const rb = getReagent(b);
      if (!ra || !rb || ra.id === rb.id) return null;
      return {
        key: pairKey(a, b),
        aId: ra.id,
        bId: rb.id,
        aFormula: ra.formula,
        bFormula: rb.formula,
        aName: ra.nameVi,
        bName: rb.nameVi,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-5 p-4 lg:p-6">
      {/* ================= Top bar ================= */}
      <header className="relative flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="sticker-btn bg-paper px-3 py-1.5 text-xs text-ink"
          title="Về trang chủ"
        >
          🏠
        </Link>
        <Link
          href="/hoc"
          className="sticker-btn bg-coral px-3.5 py-1.5 text-xs text-ink"
          title="Đổi bài học"
        >
          📚 Đổi bài học
        </Link>
        <ModeSwitchNav
          current="lab"
          contentId={contentId}
          lessonId={lesson?.id ?? null}
        />
        <div className="sticker-chip bg-mustard px-3.5 py-1.5">
          <span className="font-display max-w-[200px] truncate text-sm font-extrabold sm:max-w-none">
            {displayTitle}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setNicknameOpen(true)}
            className="sticker-btn bg-paper px-3 py-1.5 text-xs text-ink"
          >
            <span aria-hidden>👤</span>
            <span className="max-w-[160px] truncate">{nicknameInfo}</span>
          </button>
          <BadgeChip badgeLabel={notebook.badgeLabel} count={notebook.count} />
          <button
            type="button"
            onClick={() =>
              setSoundOn((prev) => {
                const next = !prev;
                try {
                  window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");
                } catch {
                  // private mode
                }
                return next;
              })
            }
            className="sticker-btn bg-paper px-2.5 py-1.5 text-xs"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="sticker-btn bg-teal-soft px-3.5 py-1.5 text-xs text-ink"
          >
            📖 Sổ tay
          </button>
        </div>
      </header>

      {/* Lesson content status */}
      {contentLoading && <WaveLoading text="Loading..." />}
      {contentError && (
        <div className="sticker-flat bg-paper-deep px-4 py-2.5 text-sm font-semibold text-ink">
          ⚠️ {contentError} — em vẫn có thể thí nghiệm tự do nhé!
        </div>
      )}

      {/* Lesson tasks */}
      {!contentLoading && tasks.length > 0 && (
        <LessonTaskCard
          lessonTitle={displayTitle}
          note={content?.note}
          tasks={tasks}
          doneKeys={doneKeys}
          onSelect={handleHintClick}
        />
      )}

      {/* ================= Main: 1 col @mobile, 2 cols @md, 3 cols @lg ================= */}
      <div className="grid flex-1 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-[260px_1fr_340px]">
        <div className="order-2 min-h-[560px] lg:order-1 lg:min-h-0">
          <ReagentShelf
            selected={selected}
            onSelect={handleSelect}
            onRemoveSlot={handleRemoveSlot}
            onSubmit={handleSubmit}
            busy={busy}
            canSubmit={selected.length === 2}
          />
        </div>

        <div className="order-1 min-h-[440px] lg:min-h-0">
          <div className="h-full">
            <LabBench
              run={run}
              requestResult={requestResult}
              onResult={handleResult}
              onReset={handleReset}
              hintEnabled={!content && notebook.count === 0}
              onHintClick={handleHintClick}
              soundOn={soundOn}
            />
          </div>
        </div>

        <div className="order-3 min-h-[360px] md:col-span-2 md:min-h-[440px] lg:col-span-1 lg:min-h-0">
          <AnalysisPanel analysis={analysis} loading={panelLoading} />
        </div>
      </div>

      <ToastStack items={notebook.toasts} onClose={notebook.dismissToast} />

      <NotebookDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        reactions={notebook.savedReactions}
        count={notebook.count}
        badgeLabel={notebook.badgeLabel}
        hasName={notebook.hasName}
        onRequireName={() => setNicknameOpen(true)}
      />

      <NicknameDialog
        open={nicknameOpen}
        initialName={notebook.nickname}
        onSave={(name) => {
          notebook.setNickname(name);
          setNicknameOpen(false);
        }}
        onClose={() => setNicknameOpen(false)}
      />
    </main>
  );
}
