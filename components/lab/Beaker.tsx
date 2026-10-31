"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bubbles } from "./Bubbles";
import { Precipitate } from "./Precipitate";
import { Smoke } from "./Smoke";
import { MetalPiece } from "./MetalPiece";

export interface BeakerProps {
  liquidColor: string;
  /** 0–100 */
  liquidLevel: number;
  hasGas: boolean;
  gasColor?: string | null;
  hasPrecipitate: boolean;
  precipitateColor?: string | null;
  heat: "normal" | "exothermic" | "endothermic";
  /** Solid metal thrown into the beaker */
  solidPiece?: { color: string } | null;
}

const GLASS_W = 220;
const GLASS_H = 190;

export function Beaker({
  liquidColor,
  liquidLevel,
  hasGas,
  gasColor,
  hasPrecipitate,
  precipitateColor,
  heat,
  solidPiece,
}: BeakerProps) {
  const reduceMotion = useReducedMotion();
  const level = Math.min(100, Math.max(0, liquidLevel));
  const isExo = heat === "exothermic";
  const isEndo = heat === "endothermic";
  const tremor = isExo && !reduceMotion;

  return (
    <div className="relative" style={{ width: GLASS_W, height: GLASS_H + 8 }}>
      {/* Beaker body */}
      <motion.div
        className="relative"
        style={{ width: GLASS_W, height: GLASS_H }}
        animate={
          tremor
            ? { x: [0, -2, 2, -2, 0], rotate: [0, -0.6, 0.6, -0.6, 0] }
            : { x: 0, rotate: 0 }
        }
        transition={{ duration: 0.6, repeat: tremor ? 1 : 0 }}
      >
        {/* Pouring notch (spout) — hand-drawn retro stroke */}
        <div
          aria-hidden
          className="absolute -top-1 left-3 h-2 w-2 border-t-2 border-r-2"
          style={{ borderColor: "var(--color-ink)" }}
        />

        {/* Liquid clip area (thick ink outline = retro illustration) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-b-[2.2rem] rounded-t-md"
          style={{
            borderLeft: "3.5px solid var(--color-ink)",
            borderRight: "3.5px solid var(--color-ink)",
            borderBottom: "3.5px solid var(--color-ink)",
            background: "rgba(255,253,246,0.65)",
          }}
        >
          {/* Liquid */}
          <motion.div
            className="absolute bottom-0 left-0 right-0"
            animate={{
              height: `${level}%`,
              backgroundColor: liquidColor,
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ minHeight: level > 0 ? 10 : 0 }}
          >
            {hasPrecipitate && !reduceMotion && (
              <Precipitate color={precipitateColor ?? "#94a3b8"} />
            )}
            {level > 0 && !reduceMotion && (
              <div
                aria-hidden
                className="absolute left-2 top-0 h-full w-3 rounded-full opacity-60"
                style={{ backgroundColor: "rgba(255,255,255,0.45)" }}
              />
            )}
          </motion.div>

          {/* Solid metal piece inside the beaker */}
          {solidPiece && !reduceMotion && (
            <MetalPiece color={solidPiece.color} />
          )}
        </div>

        {/* Glass highlight (static) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-2 top-2 h-[120%] w-4 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.5)", top: -8 }}
        />
      </motion.div>

      {/* Gas bubbles hovering at liquid surface */}
      {hasGas && (
        <div
          className="absolute left-0 right-0"
          style={{ bottom: (GLASS_H - 8) * (level / 100) }}
        >
          {reduceMotion ? null : (
            <Bubbles color={gasColor ?? "#ffffff"} />
          )}
        </div>
      )}

      {/* Exothermic smoke */}
      {isExo && !reduceMotion && (
        <div className="absolute left-0 right-0" style={{ top: -10 }}>
          <Smoke />
        </div>
      )}

      {/* Endothermic cold rim */}
      {isEndo && (
        <div
          aria-hidden
          className="absolute inset-x-4 bottom-0 top-4 rounded-b-[1.8rem] ring-2 ring-sky-300/70"
        />
      )}
    </div>
  );
}
