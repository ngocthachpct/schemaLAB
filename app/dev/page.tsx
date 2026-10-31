"use client";

import { useState } from "react";
import { MotionConfig } from "framer-motion";
import { Beaker } from "@/components/lab/Beaker";
import { PourAnimation } from "@/components/lab/PourAnimation";

type Heat = "normal" | "exothermic" | "endothermic";

const PURPLE = "#a855f7";

function Button({
  label,
  onClick,
  tone = "slate",
}: {
  label: string;
  onClick: () => void;
  tone?: "slate" | "blue" | "red" | "green";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-700 hover:bg-slate-600",
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500",
    green: "bg-emerald-600 hover:bg-emerald-500",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors ${tones[tone]}`}
    >
      {label}
    </button>
  );
}

export default function DevBeakerPage() {
  const [liquidColor, setLiquidColor] = useState("#e0f2fe");
  const [level, setLevel] = useState(60);
  const [hasGas, setHasGas] = useState(false);
  const [hasPrecipitate, setHasPrecipitate] = useState(false);
  const [heat, setHeat] = useState<Heat>("normal");
  const [solidPiece, setSolidPiece] = useState<{ color: string } | null>(null);
  const [pocA, setPocA] = useState(false);
  const [pocB, setPocB] = useState(false);
  // Incrementing id remounts Precipitate/Bubbles so each simulation replays cleanly
  const [fxId, setFxId] = useState(0);

  const clear = () => {
    setLiquidColor("#e0f2fe");
    setLevel(60);
    setHasGas(false);
    setHasPrecipitate(false);
    setHeat("normal");
    setSolidPiece(null);
    setPocA(false);
    setPocB(false);
    setFxId((v) => v + 1);
  };

  const applyFx = (on: (id: number) => void) => {
    setFxId((v) => {
      on(v + 1);
      return v + 1;
    });
  };

  return (
    <MotionConfig reducedMotion="never">
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center gap-6 p-6">
        <h1 className="text-lg font-bold">
          /dev – Kiểm thử Beaker độc lập
        </h1>

        <div className="relative">
          <PourAnimation
            color="#60a5fa"
            labelColor="#fca5a5"
            formula="CuSO4"
            side="left"
            pouring={pocA}
          />
          <PourAnimation
            color="#fef9c3"
            labelColor="#a5b4fc"
            formula="NaOH"
            side="right"
            pouring={pocB}
          />
          <div className="rounded-b-xl bg-[#e8dcc3] p-6 shadow-inner">
            <Beaker
              key={`fx-${fxId}`}
              liquidColor={liquidColor}
              liquidLevel={level}
              hasGas={hasGas}
              gasColor="#ffffff"
              hasPrecipitate={hasPrecipitate}
              precipitateColor="#3b82f6"
              heat={heat}
              solidPiece={solidPiece}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button label="Đổ lọ A" onClick={() => applyFx(() => { setPocA(true); setTimeout(() => setPocA(false), 900); })} tone="blue" />
          <Button label="Đổ lọ B" onClick={() => applyFx(() => { setPocB(true); setTimeout(() => setPocB(false), 900); })} tone="blue" />
          <Button label="Sủi bọt" onClick={() => applyFx(() => setHasGas(true))} />
          <Button label="Kết tủa" onClick={() => applyFx(() => setHasPrecipitate(true))} />
          <Button label="Khói + tỏa nhiệt" onClick={() => applyFx(() => { setHasGas(false); setHeat("exothermic"); })} tone="red" />
          <Button label="Hút nhiệt" onClick={() => applyFx(() => setHeat("endothermic"))} />
          <Button label="Thả kim loại" onClick={() => applyFx(() => setSolidPiece({ color: "#9ca3af" }))} />
          <Button label="Đổi màu nước" onClick={() => applyFx(() => setLiquidColor(PURPLE))} />
          <Button label="Reset" onClick={clear} tone="green" />
        </div>

        <div className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="mb-2 font-semibold">Mức nước &amp; màu</p>
          <label className="flex items-center gap-3">
            <span className="w-24">Mực nước</span>
            <input
              type="range"
              min={0}
              max={100}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right">{level}%</span>
          </label>
          <label className="mt-2 flex items-center gap-3">
            <span className="w-24">Màu nước</span>
            <input
              type="color"
              value={liquidColor}
              onChange={(e) => setLiquidColor(e.target.value)}
            />
            <code className="text-xs">{liquidColor}</code>
          </label>
        </div>
      </main>
    </MotionConfig>
  );
}
