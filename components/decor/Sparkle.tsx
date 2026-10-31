"use client";

interface SparkleProps {
  className?: string;
  /** decorative star color */
  tone?: string;
  size?: number;
  delay?: string;
}

/** Hand-drawn four-point twinkle, used as retro illustration decor */
export function Sparkle({
  className = "",
  tone = "#f2c14e",
  size = 22,
  delay = "0s",
}: SparkleProps) {
  return (
    <svg
      aria-hidden
      className={`chemlab-twinkle pointer-events-none ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: "twinkle 2.4s ease-in-out infinite", animationDelay: delay }}
    >
      <path
        d="M12 2 L13.8 9.2 L21 11 L13.8 12.8 L12 20 L10.2 12.8 L3 11 L10.2 9.2 Z"
        fill={tone}
        stroke="#2f2a26"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
