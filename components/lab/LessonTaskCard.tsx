"use client";

interface LessonTask {
  key: string;
  aId: string;
  bId: string;
  aFormula: string;
  bFormula: string;
  aName: string;
  bName: string;
}

interface LessonTaskCardProps {
  lessonTitle: string;
  note?: string;
  tasks: readonly LessonTask[];
  doneKeys: ReadonlySet<string>;
  onSelect: (aId: string, bId: string) => void;
}

export function LessonTaskCard({
  lessonTitle,
  note,
  tasks,
  doneKeys,
  onSelect,
}: LessonTaskCardProps) {
  return (
    <div className="card-sticker p-4" style={{ backgroundColor: "#fffdf6" }}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-base font-extrabold text-ink">
          📚 Nhiệm vụ bài học
        </h3>
        <span className="sticker-chip bg-teal-soft px-2.5 py-0.5 text-[11px] text-ink">
          {lessonTitle}
        </span>
        <span className="ml-auto text-xs font-bold text-ink-soft">
          {doneKeys.size}/{tasks.length} hoàn thành
        </span>
      </div>
      {note && (
        <p className="mt-1 text-xs font-medium text-ink-soft">{note}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {tasks.map((t) => {
          const done = doneKeys.has(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.aId, t.bId)}
              disabled={done}
              className={`sticker-btn px-3 py-1.5 text-xs ${
                done ? "bg-teal-soft opacity-70" : "bg-paper"
              }`}
              title={`${t.aName} + ${t.bName}`}
            >
              {done ? "✅ " : ""}
              {t.aFormula} + {t.bFormula}
            </button>
          );
        })}
      </div>
    </div>
  );
}
