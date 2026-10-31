"use client";

import { useMemo, type CSSProperties } from "react";

interface BubblesProps {
  color?: string;
  count?: number;
}

function pseudoRandom(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function Bubbles({ color = "#ffffff", count = 9 }: BubblesProps) {
  const grains = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (6 + pseudoRandom(i, 1) * 76).toFixed(2),
        delay: (pseudoRandom(i, 2) * 1.6).toFixed(2),
        duration: (1.0 + pseudoRandom(i, 3) * 0.8).toFixed(2),
        size: 5 + Math.round(pseudoRandom(i, 4) * 5),
      })),
    [count]
  );

  return (
    <div aria-hidden className="pointer-events-none absolute left-0 right-0 h-0">
      {grains.map((g, i) => (
        <span
          key={i}
          className="chemlab-loop chemlab-bubble absolute rounded-full"
          style={
            {
              left: `${g.left}%`,
              bottom: "0px",
              width: `${g.size}px`,
              height: `${g.size}px`,
              backgroundColor: color,
              opacity: 0,
              "--chemlab-dur": `${g.duration}s`,
              "--chemlab-delay": `${g.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
