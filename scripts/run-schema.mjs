/**
 * Apply db/schema.sql to the Neon database.
 * Usage: node scripts/run-schema.mjs   (requires DATABASE_URL env)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlText = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Thieu DATABASE_URL. Hay cau hinh .env truoc (xem .env.example).");
  process.exit(1);
}

const sql = neon(url);
const statements = sqlText
  .split(";")
  // Gach dau --- la comment trong segment, khong bo ca statement
  .map((s) =>
    s
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
      .trim()
  )
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("Da chay:", stmt.split("\n")[0]);
}
console.log(`Da ap dung ${statements.length} cau lenh schema.`);
