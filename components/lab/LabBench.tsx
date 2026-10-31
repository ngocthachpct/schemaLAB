"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Beaker } from "./Beaker";
import { PourAnimation } from "./PourAnimation";
import { ObservingLoader } from "@/components/analysis/ObservingLoader";
import type { Reagent } from "@/lib/reagents";
import type { ReactionResult, ReactResponse } from "@/lib/schema";
import { playSound } from "@/lib/sfx";
import { Sparkle } from "@/components/decor/Sparkle";

export interface ExperimentRun {
  id: number;
  a: Reagent;
  b: Reagent;
}

export interface AnalysisOutput {
  a: Reagent;
  b: Reagent;
  result: ReactionResult | null;
  source: "local" | "cache" | "ai";
  message?: string;
  isNew?: boolean;
}

interface LabBenchProps {
  run: ExperimentRun | null;
  requestResult: (a: string, b: string) => Promise<ReactResponse>;
  onResult: (out: AnalysisOutput) => void;
  onReset: () => void;
  hintEnabled?: boolean;
  onHintClick?: (a: string, b: string) => void;
  soundOn?: boolean;
}

interface LiquidState {
  color: string;
  level: number;
}

const EMPTY_LIQUID: LiquidState = { color: "#e0f2fe", level: 0 };

export function LabBench({
  run,
  requestResult,
  onResult,
  onReset,
  hintEnabled = false,
  onHintClick,
  soundOn = false,
}: LabBenchProps) {
  const reduce = useReducedMotion();
  const [liquid, setLiquid] = useState<LiquidState>(EMPTY_LIQUID);
  const [solidPiece, setSolidPiece] = useState<{ color: string } | null>(null);
  const [pourA, setPourA] = useState(false);
  const [pourB, setPourB] = useState(false);
  const [observing, setObserving] = useState(false);
  const [after, setAfter] = useState<{
    hasGas: boolean;
    gasColor: string | null;
    hasPrecipitate: boolean;
    precipitateColor: string | null;
    heat: "normal" | "exothermic" | "endothermic";
  } | null>(null);

  // Latest soundOn without restarting the timeline effect
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    if (!run) {
      setLiquid(EMPTY_LIQUID);
      setSolidPiece(null);
      setPourA(false);
      setPourB(false);
      setObserving(false);
      setAfter(null);
      return;
    }

    const cancelled = { v: false };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void): void => {
      timers.push(
        setTimeout(() => {
          if (!cancelled.v) fn();
        }, ms)
      );
    };
    const a = run.a;
    const b = run.b;
    // Reset visual state for the new experiment
    setLiquid(EMPTY_LIQUID);
    setSolidPiece(null);
    setPourA(false);
    setPourB(false);
    setObserving(false);
    setAfter(null);

    /* -------- Timeline (spec 11.2) -------- */

    // 0.0s: reagent A (liquid pour / solid drop)
    playSound("pour", soundRef.current);
    if (a.state === "solid") {
      later(120, () => setSolidPiece({ color: a.color }));
    } else {
      setPourA(true);
      later(300, () => setLiquid({ level: 40, color: a.color }));
      later(950, () => setPourA(false));
    }

    // 0.8s: reagent B
    if (b.state === "solid") {
      later(800, () => setSolidPiece({ color: b.color }));
    } else {
      later(800, () => setPourB(true));
      later(1100, () => setLiquid({ level: 70, color: b.color }));
      later(1700, () => setPourB(false));
    }
    // Both solids: a small water base so the piece is visible
    if (a.state === "solid" && b.state === "solid") {
      later(1200, () => setLiquid({ level: 30, color: "#e0f2fe" }));
    }

    // Fire the engine call right away (local/cache is instant, AI takes time)
    let pending: ReactResponse | null = null;
    void requestResult(a.id, b.id)
      .then((res) => {
        pending = res;
      })
      .catch(() => {
        pending = {
          error: "fallback",
          message: "AI đang bận, em thử cặp chất khác nhé!",
        };
      });

    const applyReveal = (res: ReactResponse): void => {
      if ("result" in res) {
        const fx = res.result.visual_effects;
        // Transition to final color (0.8s easeInOut inside Beaker)
        setLiquid({ level: 65, color: fx.final_liquid_color });
        setAfter(
          res.result.has_reaction
            ? {
                hasGas: fx.has_gas,
                gasColor: fx.gas_color,
                hasPrecipitate: fx.has_precipitate,
                precipitateColor: fx.precipitate_color,
                heat: fx.heat_level,
              }
            : null
        );
        playSound("reveal", soundRef.current);
        // Analysis panel starts right after the color settles (~0.6s)
        later(600, () =>
          onResult({
            a,
            b,
            result: res.result,
            source: res.source,
          })
        );
      } else {
        setObserving(false);
        onResult({ a, b, result: null, source: "local", message: res.message });
      }
    };

    const attemptReveal = (): void => {
      if (cancelled.v) return;
      if (!pending) {
        setObserving(true);
        later(300, attemptReveal); // keep polling until the engine answers
        return;
      }
      setObserving(false);
      applyReveal(pending);
    };

    // 2.0s: reveal effects as soon as a result exists
    later(2000, attemptReveal);

    return () => {
      cancelled.v = true;
      for (const t of timers) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id]);

  const showHint =
    hintEnabled && !run && liquid.level === 0 && !observing && !after;

  return (
    <section
      aria-label="Bàn thí nghiệm"
      className="card-sticker relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#f7ecd8" }}
    >
      {/* Sunburst illustration behind the beaker */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: "10%",
          width: 560,
          height: 560,
          background:
            "repeating-conic-gradient(from -6deg at 50% 50%, rgba(242,193,78,0.30) 0deg 8deg, transparent 8deg 24deg)",
        }}
      />
      {/* Wood bench plank (illustration) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(98,64,34,0.16) 0 2.5px, transparent 2.5px 54px), linear-gradient(#d9a86c, #c08a4e)",
          borderTop: "3px solid var(--color-ink)",
        }}
      />
      <Sparkle className="absolute left-5 top-5" tone="#e07a5f" delay="0.3s" />
      <Sparkle className="absolute right-6 top-10" tone="#3f9e8d" delay="1.4s" size={16} />

      {/* Empty-state guide (spec 10.3) */}
      {showHint && (
        <div className="absolute inset-x-0 top-7 z-10 flex flex-col items-center gap-2.5 text-center">
          <p className="font-display text-sm font-bold text-ink-soft">
            Chọn 2 hóa chất để bắt đầu thí nghiệm
          </p>
          {onHintClick && (
            <button
              type="button"
              onClick={() => onHintClick("cuso4", "naoh")}
              className="sticker-btn bg-teal-soft px-3.5 py-1.5 text-xs text-ink rot-neg"
            >
              ✨ Gợi ý: thử trộn đồng sunfat với natri hiđroxit
            </button>
          )}
        </div>
      )}

      {/* Beaker + pouring bottles */}
      <div className="relative z-10">
        {run && run.a.state !== "solid" && (
          <PourAnimation
            key={`pour-a-${run.id}`}
            color={run.a.color}
            labelColor={run.a.labelColor}
            formula={run.a.formula}
            side="left"
            pouring={pourA}
          />
        )}
        {run && run.b.state !== "solid" && (
          <PourAnimation
            key={`pour-b-${run.id}`}
            color={run.b.color}
            labelColor={run.b.labelColor}
            formula={run.b.formula}
            side="right"
            pouring={pourB}
          />
        )}
        {/* key forces Precipitate/Bubbles to remount (clean replay) per experiment */}
        <Beaker
          key={`beaker-${run?.id ?? 0}`}
          liquidColor={liquid.color}
          liquidLevel={liquid.level}
          hasGas={after?.hasGas ?? false}
          gasColor={after?.gasColor ?? "#ffffff"}
          hasPrecipitate={after?.hasPrecipitate ?? false}
          precipitateColor={after?.precipitateColor ?? null}
          heat={after?.heat ?? "normal"}
          solidPiece={solidPiece}
        />
      </div>

      {/* Observing loader during engine call */}
      {observing && !reduce && (
        <div className="absolute inset-x-0 bottom-7 z-10 flex justify-center">
          <ObservingLoader />
        </div>
      )}

      {/* Reset button (spec 10.3) */}
      <button
        type="button"
        onClick={onReset}
        className="sticker-btn absolute right-3 top-3 z-10 bg-paper px-2.5 py-1.5 text-[11px] text-ink sm:right-4 sm:top-4 sm:px-3 sm:text-xs"
      >
        <span aria-hidden>🧽</span>
        <span className="hidden sm:inline">Làm sạch cốc</span>
        <span className="sm:hidden">Reset</span>
      </button>
    </section>
  );
}
