import { getDb } from "./db";

/**
 * Sliding-minute rate limit per IP backed by the rate_limit table.
 * Fail-open when the DB is unavailable so tier 1/2 keep working (spec 5.4).
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const db = getDb();
  if (!db) return true;

  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? "10");
  if (!Number.isFinite(limit) || limit <= 0) return true;

  const minuteMs = 60_000;
  const windowStart = new Date(Math.floor(Date.now() / minuteMs) * minuteMs);

  const rows = (await db`
    INSERT INTO rate_limit (ip, window_start, count)
    VALUES (${ip}, ${windowStart.toISOString()}, 1)
    ON CONFLICT (ip, window_start)
    DO UPDATE SET count = rate_limit.count + 1
    RETURNING count
  `) as unknown as { count: number }[];

  const count = rows.length > 0 ? Number(rows[0].count) : 1;
  return count <= limit;
}

export const RATE_LIMIT_MESSAGE =
  "Em đã vượt giới hạn câu hỏi AI trong một phút rồi, chờ chút nhé!";
