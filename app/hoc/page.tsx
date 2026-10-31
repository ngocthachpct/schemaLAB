"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { GRADES, LESSONS, type Grade } from "@/lib/lessons";
import {
  CONTENT_KIND_LABEL_VI,
  studyModeToKind,
  type ContentKind,
  type LessonContentMeta,
} from "@/lib/content";
import { NicknameDialog } from "@/components/NicknameDialog";
import { useNotebook } from "@/hooks/useNotebook";
import { Sparkle } from "@/components/decor/Sparkle";
import { ClerkChrome, ClerkMineGate } from "@/components/auth/ClerkChrome";
import { PrefillNickname } from "@/components/auth/PrefillNickname";
import { WaveLoading } from "@/components/ui/WaveLoading";
import { hasClerk } from "@/hooks/useClerkOptional";

type Subject = "chemistry";
type StudyMode = "theory" | "review" | "lab";
type Source = "sgk" | "mine";

function StepHeader({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`sticker-chip flex h-8 w-8 items-center justify-center rounded-full p-0 font-display text-sm ${
          active ? "bg-mustard text-ink" : "bg-paper-deep text-ink-soft"
        }`}
      >
        {n}
      </span>
      <span
        className={`font-display text-lg font-extrabold ${active ? "text-ink" : "text-ink-soft"}`}
      >
        {label}
      </span>
    </div>
  );
}

const MODE_OPTIONS = [
  {
    id: "theory" as const,
    icon: "📖",
    title: "Học Bài",
    subtitle: "Học lý thuyết",
    tone: "bg-teal-soft",
  },
  {
    id: "review" as const,
    icon: "🃏",
    title: "Ôn Tập",
    subtitle: "Flash card",
    tone: "bg-lilac",
  },
  {
    id: "lab" as const,
    icon: "🧪",
    title: "Phòng Thí Nghiệm",
    subtitle: "Thực hành thí nghiệm",
    tone: "bg-coral",
  },
] as const;

export default function StudyPage() {
  const router = useRouter();
  const notebook = useNotebook();
  const [nicknameOpen, setNicknameOpen] = useState(false);

  const [grade, setGrade] = useState<Grade | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [mode, setMode] = useState<StudyMode | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [sgkLessonId, setSgkLessonId] = useState<string | null>(null);
  const [mineId, setMineId] = useState<string | null>(null);

  const [mineList, setMineList] = useState<LessonContentMeta[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [mineError, setMineError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const contentKind: ContentKind | null = mode ? studyModeToKind(mode) : null;

  const lessonsForGrade = grade
    ? LESSONS.filter((l) => l.grade === grade).sort((a, b) => a.order - b.order)
    : [];

  const loadMine = useCallback(async () => {
    if (!grade || !contentKind || !hasClerk) return;
    setLoadingMine(true);
    setMineError(null);
    try {
      const qs = new URLSearchParams({
        grade,
        subject: "chemistry",
        kind: contentKind,
      });
      const res = await fetch(`/api/my-contents?${qs}`, { cache: "no-store" });
      const data = (await res.json()) as { contents?: LessonContentMeta[]; message?: string };
      if (res.ok && Array.isArray(data.contents)) {
        setMineList(data.contents);
      } else if (res.status === 401) {
        setMineError("Em cần đăng nhập để xem bài của mình.");
        setMineList([]);
      } else if (res.status === 503) {
        setMineError("Chưa cấu hình DATABASE_URL nên chưa xem được bài đã lưu.");
        setMineList([]);
      } else {
        setMineError(data.message ?? "Chưa tải được danh sách bài của em.");
        setMineList([]);
      }
    } catch {
      setMineError("Lỗi mạng khi tải bài của em.");
      setMineList([]);
    } finally {
      setLoadingMine(false);
    }
  }, [grade, contentKind]);

  useEffect(() => {
    if (source === "mine" && hasClerk) void loadMine();
  }, [source, loadMine]);

  const resetFrom = (level: "grade" | "subject" | "mode" | "source") => {
    if (level === "grade") {
      setSubject(null);
      setMode(null);
      setSource(null);
    } else if (level === "subject") {
      setMode(null);
      setSource(null);
    } else if (level === "mode") {
      setSource(null);
    }
    setSgkLessonId(null);
    setMineId(null);
    setMineList([]);
    setImportMsg(null);
  };

  const uploadMine = async (file: File): Promise<void> => {
    if (!grade || !contentKind) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", contentKind);
      form.append("grade", grade);
      form.append("subject", "chemistry");
      const res = await fetch("/api/my-contents/import", { method: "POST", body: form });
      const data = (await res.json()) as {
        content?: { id: number };
        message?: string;
      };
      if (res.ok && data.content?.id) {
        setImportMsg({
          tone: "ok",
          text: `🎉 Đã tạo & lưu bộ ${CONTENT_KIND_LABEL_VI[contentKind]}!`,
        });
        await loadMine();
        setMineId(String(data.content.id));
      } else {
        setImportMsg({
          tone: "err",
          text: data.message ?? "Không tạo được bài, thử lại nhé!",
        });
      }
    } catch {
      setImportMsg({ tone: "err", text: "Lỗi mạng khi tải file lên." });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const goSelected = (): void => {
    if (!mode) return;
    if (source === "sgk" && sgkLessonId) {
      const qs = `lesson=${sgkLessonId}&content=${encodeURIComponent(`static:${sgkLessonId}`)}`;
      if (mode === "theory") router.push(`/ly-thuyet?${qs}`);
      else if (mode === "review") router.push(`/on-tap?${qs}`);
      else router.push(`/lab?${qs}`);
      return;
    }
    if (source === "mine" && mineId) {
      const qs = `content=${encodeURIComponent(mineId)}`;
      if (mode === "theory") router.push(`/ly-thuyet?${qs}`);
      else if (mode === "review") router.push(`/on-tap?${qs}`);
      else router.push(`/lab?${qs}`);
    }
  };

  const canGo =
    mode !== null &&
    ((source === "sgk" && sgkLessonId !== null) ||
      (source === "mine" && mineId !== null));

  const step = !grade ? 1 : !subject ? 2 : !mode ? 3 : !source ? 4 : 5;

  return (
    <main className="mx-auto flex min-h-screen max-w-[900px] flex-col gap-5 p-4 lg:p-6">
      <header className="relative flex flex-wrap items-center gap-3">
        <Link href="/" className="sticker-btn bg-paper px-3 py-1.5 text-xs text-ink">
          🏠 Trang chủ
        </Link>
        <h1 className="font-display text-xl font-extrabold text-ink">Chọn bài học</h1>
        <Sparkle tone="#e07a5f" size={18} delay="0.4s" />
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setNicknameOpen(true)}
            className="sticker-btn bg-paper px-3 py-1.5 text-xs text-ink"
          >
            👤 {notebook.hasName ? notebook.nickname : "Biệt danh"}
          </button>
          <ClerkChrome />
        </div>
      </header>

      {hasClerk && (
        <PrefillNickname hasName={notebook.hasName} setNickname={notebook.setNickname} />
      )}

      {/* 1 Khối */}
      <section className="card-sticker p-5" style={{ opacity: step === 1 ? 1 : 0.75 }}>
        <StepHeader n={1} label="Khối lớp" active />
        <div className="mt-3 flex flex-wrap gap-3">
          {GRADES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setGrade(g.id);
                resetFrom("grade");
              }}
              className={`sticker-btn px-6 py-3 font-display text-lg ${
                grade === g.id ? "bg-mustard text-ink rot-neg" : "bg-paper text-ink"
              }`}
            >
              Lớp {g.id}
            </button>
          ))}
        </div>
      </section>

      {/* 2 Môn */}
      <section
        className="card-sticker p-5"
        style={{ opacity: grade ? 1 : 0.45, pointerEvents: grade ? "auto" : "none" }}
      >
        <StepHeader n={2} label="Môn học" active={Boolean(grade)} />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setSubject("chemistry");
              resetFrom("subject");
            }}
            className={`sticker-btn px-5 py-3 text-base ${
              subject === "chemistry" ? "bg-teal-soft text-ink rot-neg" : "bg-paper text-ink"
            }`}
          >
            ⚗️ Hóa học
          </button>
          {["Vật lý", "Toán"].map((s) => (
            <span
              key={s}
              className="sticker-chip cursor-not-allowed bg-paper-deep px-4 py-2.5 text-sm text-ink-soft opacity-60"
            >
              {s} 🔒
            </span>
          ))}
        </div>
      </section>

      {/* 3 Chế độ */}
      <section
        className="card-sticker p-5"
        style={{ opacity: subject ? 1 : 0.45, pointerEvents: subject ? "auto" : "none" }}
      >
        <StepHeader n={3} label="Chế độ học" active={Boolean(subject)} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setMode(opt.id);
                resetFrom("mode");
              }}
              className={`sticker-flat p-4 text-left hover:-translate-y-0.5 ${
                mode === opt.id ? `${opt.tone} rot-neg` : "bg-paper"
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <p className="mt-2 font-display text-base font-extrabold text-ink">{opt.title}</p>
              <p className="mt-0.5 text-xs font-medium text-ink-soft">{opt.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 4 Nguồn */}
      <section
        className="card-sticker p-5"
        style={{ opacity: mode ? 1 : 0.45, pointerEvents: mode ? "auto" : "none" }}
      >
        <StepHeader n={4} label="Nguồn nội dung" active={Boolean(mode)} />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSource("sgk");
              setSgkLessonId(null);
              setMineId(null);
              setImportMsg(null);
            }}
            className={`sticker-flat p-4 text-left hover:-translate-y-0.5 ${
              source === "sgk" ? "bg-teal-soft rot-neg" : "bg-paper"
            }`}
          >
            <p className="font-display text-base font-extrabold text-ink">📖 SGK sẵn có</p>
            <p className="mt-1 text-xs font-medium text-ink-soft">
              Chọn bài trong danh mục lớp {grade ?? "…"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setSource("mine");
              setSgkLessonId(null);
              setMineId(null);
              setImportMsg(null);
            }}
            className={`sticker-flat p-4 text-left hover:-translate-y-0.5 ${
              source === "mine" ? "bg-lilac rot-neg" : "bg-paper"
            }`}
          >
            <p className="font-display text-base font-extrabold text-ink">📁 Bài của tôi</p>
            <p className="mt-1 text-xs font-medium text-ink-soft">
              Bài đã tạo / nhập file (cần đăng nhập)
            </p>
          </button>
        </div>
      </section>

      {/* 5 Danh sách theo nguồn */}
      <section
        className="card-sticker p-5"
        style={{ opacity: source ? 1 : 0.45, pointerEvents: source ? "auto" : "none" }}
      >
        <StepHeader
          n={5}
          label={source === "mine" ? "Bài của tôi" : "Bài học SGK"}
          active={Boolean(source)}
        />

        {!source && (
          <p className="mt-3 text-sm font-medium text-ink-soft">Chọn nguồn nội dung trước nhé!</p>
        )}

        {source === "sgk" && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {lessonsForGrade.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSgkLessonId(l.id)}
                className={`sticker-flat p-3 text-left hover:-translate-y-0.5 ${
                  sgkLessonId === l.id ? "bg-teal-soft" : "bg-paper"
                }`}
              >
                <p className="font-display text-sm font-extrabold text-ink">{l.title}</p>
                <p className="mt-1 text-xs font-medium text-ink-soft">{l.description}</p>
              </button>
            ))}
          </div>
        )}

        {source === "mine" && (
          <div className="mt-3 flex flex-col gap-3">
            <ClerkMineGate
              fallback={
                <div className="sticker-flat bg-paper-deep px-4 py-4 text-sm font-semibold text-ink">
                  <p>Đăng nhập để xem và tạo bài của em.</p>
                  {hasClerk && (
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="sticker-btn mt-3 bg-mustard px-4 py-2 text-sm text-ink"
                      >
                        Đăng nhập / Đăng ký
                      </button>
                    </SignInButton>
                  )}
                </div>
              }
            >
              <>
                <label
                  className={`sticker-btn w-fit bg-coral px-4 py-3 text-sm text-ink ${
                    importing ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {importing
                    ? "⏳ Đang tạo…"
                    : `➕ Tạo bài học mới (${CONTENT_KIND_LABEL_VI[contentKind!]})`}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.json,.csv"
                    className="hidden"
                    disabled={importing}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadMine(f);
                    }}
                  />
                </label>
                <p className="text-xs font-medium text-ink-soft">
                  File .txt / .md / .json / .csv (≤500KB). AI tạo theo chế độ đã chọn và lưu vào tài
                  khoản của em.
                </p>

                {importMsg && (
                  <div
                    className="sticker-flat px-3.5 py-2.5 text-sm font-semibold"
                    style={{
                      backgroundColor: importMsg.tone === "ok" ? "#d9efe7" : "#fde2d8",
                      borderColor: importMsg.tone === "ok" ? "var(--color-ink)" : "#b3402a",
                    }}
                  >
                    {importMsg.text}
                  </div>
                )}

                {(loadingMine || importing) && <WaveLoading text="Loading..." />}
                {mineError && (
                  <p className="text-xs font-semibold text-ink-soft">{mineError}</p>
                )}
                {!loadingMine && !mineError && mineList.length === 0 && (
                  <p className="text-sm font-medium text-ink-soft">
                    Chưa có bài {CONTENT_KIND_LABEL_VI[contentKind!]} nào. Bấm tạo bài mới nhé!
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {mineList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setMineId(String(c.id))}
                      className={`sticker-flat flex items-center gap-3 px-3 py-2 text-left hover:-translate-y-0.5 ${
                        mineId === String(c.id) ? "bg-teal-soft" : "bg-paper"
                      }`}
                    >
                      <span className="sticker-chip bg-mustard px-2 py-0.5 text-[10px] text-ink">
                        {CONTENT_KIND_LABEL_VI[c.kind] ?? c.kind}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">{c.title}</span>
                        <span className="block truncate text-[11px] font-medium text-ink-soft">
                          {c.note || "—"}
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold text-ink-soft">
                        {new Date(c.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            </ClerkMineGate>
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-10 mx-auto">
        <button
          type="button"
          onClick={goSelected}
          disabled={!canGo}
          className={`sticker-btn px-8 py-3.5 font-display text-lg ${
            canGo ? "bg-terracotta text-white" : "bg-paper text-ink-soft"
          }`}
        >
          {!mode
            ? "Chọn chế độ học"
            : !source
              ? "Chọn nguồn nội dung"
              : !canGo
                ? "Chọn một bài ở trên"
                : mode === "theory"
                  ? "📖 Bắt đầu học lý thuyết"
                  : mode === "review"
                    ? "🃏 Bắt đầu ôn flash card"
                    : "🧪 Vào Lab triển khai!"}
        </button>
      </div>

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
