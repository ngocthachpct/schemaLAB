"use client";

interface MetalPieceProps {
  color: string;
}

export function MetalPiece({ color }: MetalPieceProps) {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 -ml-4 rounded-md"
      style={{
        bottom: 14,
        width: 32,
        height: 22,
        backgroundColor: color,
        opacity: 0,
        boxShadow: "inset 0 -4px rgba(0,0,0,0.25), inset 0 3px rgba(255,255,255,0.35)",
        animation: "metal-drop 0.85s ease-in forwards",
      }}
    />
  );
}
