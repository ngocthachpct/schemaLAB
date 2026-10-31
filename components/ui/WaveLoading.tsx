"use client";

interface WaveLoadingProps {
  /** Visible label; default "Loading..." */
  text?: string;
  /**
   * overlay = floating center of viewport (default for wait states)
   * compact = inline only
   */
  variant?: "overlay" | "compact";
  className?: string;
}

/**
 * Wave-scrolling letter loading — sticker / display-font ChemLab style.
 * Overlay floats fixed in the middle of the screen.
 */
export function WaveLoading({
  text = "Loading...",
  variant = "overlay",
  className = "",
}: WaveLoadingProps) {
  const chars = Array.from(text);

  const wave = (
    <p
      className="font-display text-2xl font-extrabold tracking-[0.08em] text-ink sm:text-3xl"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <span className="inline-flex items-end gap-[0.05em]" aria-hidden>
        {chars.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className="chemlab-wave-char inline-block"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {ch === " " ? "\u00a0" : ch}
          </span>
        ))}
      </span>
    </p>
  );

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <p
          className="font-display text-lg font-extrabold tracking-wide text-ink"
          role="status"
          aria-live="polite"
          aria-label={text}
        >
          <span className="inline-flex items-end gap-[0.04em]" aria-hidden>
            {chars.map((ch, i) => (
              <span
                key={`${ch}-${i}`}
                className="chemlab-wave-char inline-block"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {ch === " " ? "\u00a0" : ch}
              </span>
            ))}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-6 ${className}`}
      aria-busy="true"
    >
      <div
        className="absolute inset-0 bg-paper/55 backdrop-blur-[2px]"
        aria-hidden
      />
      <div className="card-sticker relative z-[1] rotate-[-1.5deg] px-10 py-6 shadow-[6px_6px_0_var(--color-ink)]">
        {wave}
      </div>
    </div>
  );
}
