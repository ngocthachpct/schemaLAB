import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ContentKindSchema, LessonPayloadSchema, type LessonPayload } from "@/lib/content";
import { getDb, DB_NOT_CONFIGURED_MESSAGE } from "@/lib/db";

export const runtime = "nodejs";

interface ContentRow {
  id: number;
  lesson_id: string | null;
  owner_user_id: string | null;
  grade: string | null;
  subject: string | null;
  source: string;
  kind: string;
  file_name: string | null;
  payload: unknown;
  created_at: string;
}

/** GET /api/my-contents/:id — one owned content (full payload) */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const cid = Number(id);
  if (!Number.isInteger(cid) || cid <= 0) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
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
      SELECT id, lesson_id, owner_user_id, grade, subject, source, kind, file_name, payload, created_at
      FROM lesson_content
      WHERE id = ${cid} AND owner_user_id = ${userId}
      LIMIT 1
    `) as unknown as ContentRow[];

    if (rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const parsed = LessonPayloadSchema.safeParse(rows[0].payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "bad_payload" }, { status: 500 });
    }

    const kind = ContentKindSchema.safeParse(rows[0].kind).success
      ? rows[0].kind
      : parsed.data.kind;

    return NextResponse.json({
      content: {
        id: rows[0].id,
        lesson_id: rows[0].lesson_id,
        owner_user_id: rows[0].owner_user_id,
        grade: rows[0].grade,
        subject: rows[0].subject,
        source: rows[0].source,
        kind,
        file_name: rows[0].file_name,
        payload: parsed.data as LessonPayload,
        created_at: rows[0].created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "db_error", message: "Không tải được nội dung." },
      { status: 500 }
    );
  }
}
