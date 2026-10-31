import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let cached: SqlClient | null = null;

/** Returns the Neon SQL client, or null when DATABASE_URL is not configured. */
export function getDb(): SqlClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!cached) {
    cached = neon(url);
  }
  return cached;
}

export const DB_NOT_CONFIGURED_MESSAGE =
  "Sổ tay chưa kết nối được cơ sở dữ liệu thí nghiệm.";
