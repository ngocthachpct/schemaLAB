import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, DB_NOT_CONFIGURED_MESSAGE } from "@/lib/db";
import { badgeForCount } from "@/lib/badges";
import { isValidReagent } from "@/lib/reagents";
import { pairKey } from "@/lib/pairKey";
import { lookupEquation, lookupEquationCached } from "@/lib/engine";

export const runtime = "nodejs";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/gu;

function sanitizeName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(CONTROL_CHARS, "").trim().slice(0, 40);
}

const NameSchema = z.string().min(1).max(40);

interface Row {
  pair_key: string;
  equation: string;
  discovered_at: string;
}

export async function GET(req: NextRequest) {
  const name = sanitizeName(req.nextUrl.searchParams.get("name"));
  if (!NameSchema.safeParse(name).success) {
    return NextResponse.json({ error: "bad_name" }, { status: 400 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "no_database", message: DB_NOT_CONFIGURED_MESSAGE },
      { status: 503 }
    );
  }
  try {
    const rows = (await db`
      SELECT pair_key, equation, discovered_at
      FROM discovered_reactions
      WHERE student_name = ${name}
      ORDER BY discovered_at DESC
    `) as Row[];
    return NextResponse.json({
      reactions: rows,
      count: rows.length,
      badge: badgeForCount(rows.length),
    });
  } catch {
    return NextResponse.json(
      { error: "db_error", message: DB_NOT_CONFIGURED_MESSAGE },
      { status: 500 }
    );
  }
}

const PostSchema = z.object({
  name: z.string().max(64),
  key: z.string().max(80),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_input" }, { status: 400 });
  }

  const name = sanitizeName(parsed.data.name);
  if (!NameSchema.safeParse(name).success) {
    return NextResponse.json({ error: "bad_name" }, { status: 400 });
  }

  // The client sends a pair key only; the server derives the trustworthy equation
  const ids = parsed.data.key.split("+");
  if (ids.length !== 2 || !isValidReagent(ids[0]) || !isValidReagent(ids[1])) {
    return NextResponse.json({ error: "bad_key" }, { status: 400 });
  }
  const key = pairKey(ids[0], ids[1]);

  const equation = (await lookupEquation(key)) ?? (await lookupEquationCached(key));
  if (!equation) {
    return NextResponse.json(
      { error: "unknown_pair", message: "Cặp chất này chưa có kết quả đã kiểm tra." },
      { status: 400 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "no_database", message: DB_NOT_CONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const inserted = (await db`
      INSERT INTO discovered_reactions (student_name, pair_key, equation)
      VALUES (${name}, ${key}, ${equation})
      ON CONFLICT (student_name, pair_key) DO NOTHING
      RETURNING id
    `) as unknown as { id: number }[];
    const isNew = inserted.length > 0;
    const counted = (await db`
      SELECT COUNT(*)::int AS count
      FROM discovered_reactions
      WHERE student_name = ${name}
    `) as unknown as { count: number }[];
    const count = Number(counted[0]?.count ?? 0);
    return NextResponse.json({ count, badge: badgeForCount(count), isNew });
  } catch {
    return NextResponse.json(
      { error: "db_error", message: "Không lưu được vào Sổ tay, thử lại nhé!" },
      { status: 500 }
    );
  }
}
