/**
 * Warm the reaction cache before a demo: POST every pair from lib/reactions.json
 * (plus a few unidentified pairs) to /api/react so tier 2 has them ready.
 *
 * Usage: node scripts/warm-cache.mjs [base_url]
 *   base_url mặc định http://localhost:3000
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = process.argv[2] ?? "http://localhost:3000";

const reactions = JSON.parse(
  readFileSync(join(__dirname, "..", "lib", "reactions.json"), "utf8")
);
const localKeys = Object.keys(reactions);

// Extra pairs for AI pre-caching (zn+agno3 is the classic demo surprise)
const extraPairs = [
  ["zn", "agno3"],
  ["fe", "agno3"],
  ["h2so4", "fe"],
];

const jobs = [
  ...localKeys.map((k) => k.split("+")),
  ...extraPairs,
];

console.log(`Nóng cache cho ${jobs.length} cặp chất tại ${baseUrl} ...`);

let ok = 0;
let soft = 0;
let fail = 0;
const started = Date.now();

for (const [a, b] of jobs) {
  try {
    const res = await fetch(`${baseUrl}/api/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a, b }),
    });
    const data = await res.json();
    if (data && data.result) {
      ok++;
      console.log(`  ✓ ${a}+${b} (nguồn: ${data.source})`);
    } else {
      soft++;
      console.log(`  • ${a}+${b}: soft fallback (${data?.message ?? "?"})`);
    }
  } catch (e) {
    fail++;
    console.log(`  ✗ ${a}+${b}: ${e?.message ?? "lỗi mạng"}`);
  }
}

console.log(
  `Xong sau ${((Date.now() - started) / 1000).toFixed(1)}s — thành công: ${ok}, soft: ${soft}, lỗi: ${fail}`
);
