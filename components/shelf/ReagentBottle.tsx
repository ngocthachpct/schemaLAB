"use client";

import type { Reagent } from "@/lib/reagents";

interface ReagentBottleProps {
  reagent: Reagent;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const INK = "#2f2a26";

export function ReagentBottle({
  reagent,
  selected,
  disabled = false,
  onClick,
}: ReagentBottleProps) {
  const isSolid = reagent.state === "solid";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={`sticker-flat flex flex-col items-center gap-1 p-1.5 pb-2 transition-transform ${
        selected
          ? "rot-neg bg-mustard"
          : "bg-paper hover:-translate-y-0.5"
      }`}
      title={reagent.nameVi}
    >
      <svg width="50" height="62" viewBox="0 0 52 64" role="img" aria-label={reagent.formula}>
        {/* Cap */}
        <rect x="16" y="2" width="20" height="9" rx="3" fill={reagent.labelColor} stroke={INK} strokeWidth="2" />
        {/* Neck */}
        <rect x="19" y="11" width="14" height="8" fill="#fffdf6" stroke={INK} strokeWidth="2" />
        {/* Body */}
        <rect x="8" y="19" width="36" height="42" rx="8" fill="#fffdf6" stroke={INK} strokeWidth="2.5" />
        {isSolid ? (
          /* Solid metal chunks */
          <g>
            <rect x="13" y="38" width="12" height="9" rx="2" fill={reagent.color} stroke={INK} strokeWidth="1.6" />
            <rect x="27" y="35" width="11" height="8" rx="2" fill={reagent.color} stroke={INK} strokeWidth="1.6" />
            <rect x="17" y="49" width="14" height="8" rx="2" fill={reagent.color} stroke={INK} strokeWidth="1.6" />
          </g>
        ) : (
          /* Solution fill */
          <rect x="10" y="36" width="32" height="23" rx="5" fill={reagent.color} />
        )}
        {/* Label band + hand-written style formula */}
        <rect x="11" y="24" width="30" height="10" rx="3" fill={reagent.labelColor} stroke={INK} strokeWidth="1.6" />
        <text
          x="26"
          y="32"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill={INK}
          fontFamily="var(--font-baloo), system-ui, sans-serif"
        >
          {reagent.formula}
        </text>
      </svg>
      <span className="w-full break-words text-center text-[10px] font-semibold leading-tight text-ink-soft">
        {reagent.nameVi}
      </span>
    </button>
  );
}
