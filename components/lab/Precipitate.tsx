"use client";

import { useMemo, type CSSProperties } from "react";
import { motion } from "framer-motion";

interface PrecipitateProps {
  color: string;
  count?: number;
}

function pseudoRandom(i: number, salt: number) {
  const x = Math.sin(i * 98.233 + salt * 45.164) * 43758.5453;
  return x - Math.floor(x);
}

const RESIDUE_DELAY_S = 1.0;

export function Precipitate({ color, count = 20 }: PrecipitateProps) {
  const grains = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (8 + pseudoRandom(i, 5) * 80).toFixed(2),
        delay: (i * 0.045).toFixed(2),
        size: 4 + Math.round(pseudoRandom(i, 6) * 4),
      })),
    [count]
  );

  return (
    <div aria-hidden className="absolute bottom-0 left-0 right-0">
      {grains.map((g, i) => (
        <span
          key={i}
          className="chemlab-precipitate absolute rounded-[3px]"
          style={
            {
              bottom: "10px",
              left: `${g.left}%`,
              width: `${g.size}px`,
              height: `${g.size}px`,
              backgroundColor: color,
              opacity: 0,
              "--chemlab-delay": `${g.delay}s`,
            } as CSSProperties
          }
        />
      ))}
      <motion.div
        className="absolute bottom-0 left-2 right-2 h-3 rounded-t-md"
        style={{ backgroundColor: color }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: RESIDUE_DELAY_S, duration: 0.6, ease: "easeInOut" }}
      />
    </div>
  );
}
