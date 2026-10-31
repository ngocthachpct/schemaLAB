"use client";

interface BadgeChipProps {
  badgeLabel: string;
  count: number;
}

export function BadgeChip({ badgeLabel, count }: BadgeChipProps) {
  const has = badgeLabel !== "Chưa có";
  return (
    <span
      className={`sticker-chip px-3 py-1.5 text-xs ${
        has ? "bg-mustard text-ink rot-neg" : "bg-paper text-ink-soft"
      }`}
      title={`Phản ứng đã khám phá: ${count}`}
    >
      <span aria-hidden>🏅</span> {badgeLabel}
      {has ? <span className="opacity-70">×{count}</span> : null}
    </span>
  );
}
