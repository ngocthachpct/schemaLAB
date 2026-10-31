"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface EquationProps {
  /** Human equation string, e.g. "CuSO4 + 2NaOH → Cu(OH)2↓ + Na2SO4" */
  value: string;
  className?: string;
}

const SUPERSCRIPTS: Record<string, string> = {
  "⁺": "+",
  "⁻": "-",
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

const isSuper = (c: string): boolean =>
  Object.prototype.hasOwnProperty.call(SUPERSCRIPTS, c);
const isLowerDigit = (c: string): boolean => /[0-9]/.test(c);
const isLetterOrParen = (c: string): boolean => /[A-Za-z)]/.test(c);

const SPECIAL_LATX: Record<string, string> = {
  "→": "\\rightarrow",
  "↓": "\\downarrow",
  "↑": "\\uparrow",
  "−": "-",
};

/**
 * Convert a human equation string to LaTeX:
 * - digits right after a letter/paren become subscripts (H2O → H_{2}O)
 * - unicode superscript charges become ^{...} (Cu²⁺ → Cu^{2+})
 * - unicode arrows/phase symbols become LaTeX specials
 */
export function equationToLatex(input: string): string {
  let out = "";
  let subBuf = "";
  let inSub = false;
  let supBuf = "";
  let inSup = false;
  let prev = "";

  const flushSub = (): void => {
    if (inSub) {
      out += `_{${subBuf}}`;
      inSub = false;
      subBuf = "";
    }
  };
  const flushSup = (): void => {
    if (inSup) {
      out += `^{${supBuf}}`;
      inSup = false;
      supBuf = "";
    }
  };

  for (const c of input) {
    if (isSuper(c)) {
      flushSub();
      inSup = true;
      supBuf += SUPERSCRIPTS[c];
      prev = c;
      continue;
    }
    if (inSup) {
      flushSup();
    }
    if (isLowerDigit(c)) {
      if (isLetterOrParen(prev) || inSub) {
        inSub = true;
        subBuf += c;
      } else {
        flushSub();
        out += c;
      }
      prev = c;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(SPECIAL_LATX, c)) {
      flushSub();
      out += ` ${SPECIAL_LATX[c]} `;
      prev = c;
      continue;
    }
    flushSub();
    switch (c) {
      case "+":
        out += " + ";
        break;
      case " ":
        break;
      default:
        out += c;
    }
    prev = c;
  }
  flushSub();
  flushSup();
  return out;
}

export function Equation({ value, className }: EquationProps) {
  const latex = equationToLatex(value);
  let html: string | null = null;
  try {
    html = katex.renderToString(latex, {
      throwOnError: false,
      output: "html",
    });
  } catch {
    html = null;
  }
  if (html) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  // Fail-safe: never crash the UI on parse errors
  return <span className={className}>{value}</span>;
}
