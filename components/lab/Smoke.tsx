"use client";

import { useMemo, type CSSProperties } from "react";

interface SmokeProps {
  count?: number;
}

function pseudoRandom(i: number, salt: number) {
  const x = Math.sin(i * 56.207 + salt * 13.157) * 43758.5453;
  return x - Math.floor(x);
}

export function Smoke({ count = 4 }: SmokeProps) {
  const wisps = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (18 + pseudoRandom(i, 7) * 60).toFixed(2),
        delay: (pseudoRandom(i, 8) * 2).toFixed(2),
        duration: (2.2 + pseudoRandom(i, 9) * 1.2).toFixed(2),
        size: 14 + Math.round(pseudoRandom(i, 10) * 12),
      })),
    [count]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-6 left-0 right-0 h-0"
    >
      {wisps.map((w, i) => (
        <span
          key={i}
          className="chemlab-loop chemlab-smoke absolute rounded-full blur-[2px]"
          style={
            {
              left: `${w.left}%`,
              bottom: "0px",
              width: `${w.size}px`,
              height: `${Math.round(w.size * 0.7)}px`,
              backgroundColor: "#cbd5e1",
              opacity: 0,
              "--chemlab-dur": `${w.duration}s`,
              "--chemlab-delay": `${w.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
