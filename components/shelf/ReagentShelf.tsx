"use client";

import { useState } from "react";
import { GROUP_LABELS_VI, REAGENTS, type Reagent, type ReagentGroup } from "@/lib/reagents";
import { ReagentBottle } from "./ReagentBottle";

interface ReagentShelfProps {
  /** Selected reagent ids, max 2 (slot A, slot B) */
  selected: readonly string[];
  onSelect: (id: string) => void;
  onRemoveSlot: (slotIndex: number) => void;
  onSubmit: () => void;
  busy?: boolean;
  canSubmit?: boolean;
}

const TABS: ReagentGroup[] = ["acid_base", "salt", "metal"];

const TAB_TONE: Record<ReagentGroup, { active: string; cap: string }> = {
  acid_base: { active: "bg-coral text-ink", cap: "bg-coral" },
  salt: { active: "bg-teal-soft text-ink", cap: "bg-teal-soft" },
  metal: { active: "bg-mustard text-ink", cap: "bg-mustard" },
};

function SlotCard({
  label,
  reagent,
  onClick,
}: {
  label: string;
  reagent?: Reagent;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sticker-flat flex min-h-[56px] flex-1 items-start gap-2 px-2.5 py-2 text-left leading-snug ${
        reagent ? "bg-teal-soft" : "dashed-frame bg-transparent"
      }`}
      title={reagent ? "Bấm để bỏ chọn" : "Chưa chọn"}
    >
      <span
        className={`sticker-chip shrink-0 translate-y-[1px] bg-ink px-1.5 py-0.5 text-[10px] leading-none text-paper`}
      >
        {label}
      </span>
      {reagent ? (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ink"
              style={{ backgroundColor: reagent.color }}
            />
            <span className="text-[11.5px] font-extrabold text-ink">
              {reagent.formula}
            </span>
          </span>
          {/* Tên hóa chất có thể dài — cho phép xuống dòng tự nhiên, tối đa 2 dòng */}
          <span className="line-clamp-2 text-[10.5px] font-semibold text-ink-soft">
            {reagent.nameVi}
          </span>
        </span>
      ) : (
        <span className="translate-y-[2px] font-medium text-ink-soft">Chưa chọn</span>
      )}
    </button>
  );
}

export function ReagentShelf({
  selected,
  onSelect,
  onRemoveSlot,
  onSubmit,
  busy = false,
  canSubmit = false,
}: ReagentShelfProps) {
  const [tab, setTab] = useState<ReagentGroup>("acid_base");
  const filtered = REAGENTS.filter((r) => r.group === tab);

  return (
    <section
      aria-label="Kệ hóa chất"
      className="card-sticker relative flex h-full flex-col gap-3 overflow-hidden p-3.5"
    >
      {/* Wood shelf board behind the bottles (illustration) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-16"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(98,64,34,0.14) 0 2px, transparent 2px 42px), linear-gradient(#d9a86c, #c08a4e)",
          borderTop: "2.5px solid var(--color-ink)",
        }}
      />

      {/* Header with hand-lettered sign */}
      <div className="relative flex items-center gap-2">
        <h2 className="font-display text-lg font-extrabold text-ink">
          Kệ<span className="text-terracotta"> hóa chất</span>
        </h2>
        <span className="sticker-chip ml-auto bg-paper-deep px-2 py-0.5 text-[10px] text-ink-soft">
          14 lọ
        </span>
      </div>

      {/* Tabs (retro segmented sticker) */}
      <div className="relative grid grid-cols-3 gap-1.5">
        {TABS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setTab(g)}
            aria-pressed={tab === g}
            className={`sticker-btn px-1 py-1.5 text-[10.5px] ${
              tab === g ? TAB_TONE[g].active : "bg-paper text-ink-soft"
            }`}
          >
            {GROUP_LABELS_VI[g]}
          </button>
        ))}
      </div>

      {/* Slots A/B */}
      <div className="relative flex gap-2.5">
        <SlotCard label="A" reagent={REAGENTS.find((r) => r.id === selected[0])} onClick={() => onRemoveSlot(0)} />
        <SlotCard label="B" reagent={REAGENTS.find((r) => r.id === selected[1])} onClick={() => onRemoveSlot(1)} />
      </div>

      <p className="relative text-[11px] font-medium leading-snug text-ink-soft">
        Bấm một lọ để chọn vào ô trống, bấm lại để bỏ chọn.
        <br />
        Không trộn một chất với chính nó nha!
      </p>

      {/* Bottles sitting on the wooden board */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-14">
        <div className="grid grid-cols-3 gap-2.5">
          {filtered.map((r) => (
            <ReagentBottle
              key={r.id}
              reagent={r}
              selected={selected.includes(r.id)}
              disabled={busy}
              onClick={() => onSelect(r.id)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || busy}
        className={`sticker-btn relative z-10 w-full px-4 py-2.5 text-sm ${
          canSubmit && !busy ? "bg-terracotta text-white" : "bg-paper text-ink-soft"
        }`}
      >
        {busy ? "Đang thí nghiệm..." : "⚗️ Thực hiện thí nghiệm"}
      </button>
    </section>
  );
}
