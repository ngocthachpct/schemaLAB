import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, DB_NOT_CONFIGURED_MESSAGE } from "@/lib/db";
import {
  CONTENT_KIND_LABEL_VI,
  ContentKindSchema,
  LessonPayloadSchema,
  type ContentKind,
  type LessonPayload,
} from "@/lib/content";
import { getLesson } from "@/lib/lessons";

export const runtime = "nodejs";

interface ContentRow {
  id: number;
  lesson_id: string;
  source: string;
  kind: string | null;
  file_name: string | null;
  payload: unknown;
  created_at: string;
}

const IdSchema = z.string().min(1).max(40);

function resolveKind(row: ContentRow, payload: LessonPayload | null): ContentKind {
  const fromCol = ContentKindSchema.safeParse(row.kind);
  if (fromCol.success) return fromCol.data;
  if (payload?.kind) return payload.kind;
  return "lab";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: "bad_lesson" }, { status: 400 });
  }
  if (!getLesson(id)) {
    return NextResponse.json({ error: "unknown_lesson" }, { status: 404 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "no_database", message: "Chưa cấu hình DATABASE_URL nên chưa xem được nội dung đã lưu." },
      { status: 503 }
    );
  }

  const kindFilter = req.nextUrl.searchParams.get("kind");
  const kindParsed = kindFilter ? ContentKindSchema.safeParse(kindFilter) : null;
  if (kindFilter && kindParsed && !kindParsed.success) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }

  try {
    const cid = req.nextUrl.searchParams.get("cid");
    if (cid !== null && cid !== "") {
      const cidNum = Number(cid);
      if (!Number.isInteger(cidNum) || cidNum <= 0) {
        return NextResponse.json({ error: "bad_cid" }, { status: 400 });
      }
      const rows = (await db`
        SELECT id, lesson_id, source, kind, file_name, payload, created_at
        FROM lesson_content
        WHERE id = ${cidNum} AND lesson_id = ${id}
        LIMIT 1
      `) as unknown as ContentRow[];
      if (rows.length === 0) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      const parsed = LessonPayloadSchema.safeParse(rows[0].payload);
      if (!parsed.success) {
        return NextResponse.json({ error: "bad_payload" }, { status: 500 });
      }
      const kind = resolveKind(rows[0], parsed.data);
      return NextResponse.json({
        content: {
          id: rows[0].id,
          lesson_id: rows[0].lesson_id,
          source: rows[0].source,
          kind,
          file_name: rows[0].file_name,
          payload: parsed.data as LessonPayload,
          created_at: rows[0].created_at,
        },
      });
    }

    const rows = (
      kindParsed?.success
        ? await db`
            SELECT id, lesson_id, source, kind, file_name, payload, created_at
            FROM lesson_content
            WHERE lesson_id = ${id} AND kind = ${kindParsed.data}
            ORDER BY created_at DESC
            LIMIT 20
          `
        : await db`
            SELECT id, lesson_id, source, kind, file_name, payload, created_at
            FROM lesson_content
            WHERE lesson_id = ${id}
            ORDER BY created_at DESC
            LIMIT 20
          `
    ) as unknown as ContentRow[];

    return NextResponse.json({
      contents: rows.map((r) => {
        const parsed = LessonPayloadSchema.safeParse(r.payload);
        const kind = resolveKind(r, parsed.success ? parsed.data : null);
        return {
          id: r.id,
          lesson_id: r.lesson_id,
          source: r.source,
          kind,
          kind_label: CONTENT_KIND_LABEL_VI[kind],
          file_name: r.file_name,
          title: parsed.success ? parsed.data.title : "Nội dung chưa rõ",
          note: parsed.success ? parsed.data.note : "",
          created_at: r.created_at,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "db_error", message: DB_NOT_CONFIGURED_MESSAGE },
      { status: 500 }
    );
  }
}
