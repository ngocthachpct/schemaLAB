"use client";

import { motion } from "framer-motion";

interface PourAnimationProps {
  /** HEX of the liquid being poured (used for stream + bottle content) */
  color: string;
  /** Bottle label color by reagent group */
  labelColor: string;
  /** Chemical formula shown on the label */
  formula: string;
  /** Side of the beaker the bottle comes from */
  side: "left" | "right";
  /** True while this reagent is being poured */
  pouring: boolean;
}

const INK = "#2f2a26";
const TILT_DEG = 118;

export function PourAnimation({
  color,
  labelColor,
  formula,
  side,
  pouring,
}: PourAnimationProps) {
  const hide = { opacity: 0, rotate: 0 };
  const hideX = side === "left" ? -60 : 60;
  const rotate = side === "left" ? TILT_DEG : -TILT_DEG;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute h-16 w-8"
      style={{ top: -84, transformOrigin: "bottom center", ...(side === "left" ? { left: 4 } : { right: 4 }) }}
      initial={{ opacity: 0, x: hideX, rotate: 0 }}
      animate={pouring ? { opacity: 1, x: 0, rotate } : { ...hide, x: hideX }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Simple 2D reagent bottle, pure divs (retro illustration strokes) */}
      <div className="relative h-16 w-8">
        <div
          className="absolute left-1/2 top-0 h-4 w-2.5 -translate-x-1/2 rounded-t-sm"
          style={{ backgroundColor: INK }}
        />
        <div
          className="absolute inset-x-0 top-4 bottom-0 overflow-hidden rounded-md"
          style={{
            backgroundColor: "#fffdf6",
            border: `2px solid ${INK}`,
          }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 h-2/3"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute left-0 right-0 top-1/3 h-4"
            style={{ backgroundColor: labelColor }}
          >
            <span className="block text-center text-[5px] font-extrabold leading-none" style={{ color: INK }}>
              {formula}
            </span>
          </div>
        </div>
      </div>
      {pouring && (
        <motion.div
          className="absolute left-1/2 top-16 w-1 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: color, transformOrigin: "top center" }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 0.85 }}
          transition={{ duration: 0.25 }}
        >
          <div className="h-20 w-full" />
        </motion.div>
      )}
    </motion.div>
  );
}
