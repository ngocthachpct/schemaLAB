import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  ContentKindSchema,
  LessonPayloadSchema,
  type ContentKind,
  type LessonPayload,
} from "@/lib/content";
import {
  deriveSiblingWithoutLlm,
  generateSiblingKindContent,
} from "@/lib/gemini";
import { getDb, DB_NOT_CONFIGURED_MESSAGE } from "@/lib/db";

export const runtime = "nodejs";

const BodySchema = z.object({
  fromId: z.number().int().positive(),
  kind: ContentKindSchema,
});

interface ContentRow {
  id: number;
  lesson_id: string | null;
  owner_user_id: string | null;
  grade: string | null;
  subject: string | null;
  source: string;
  kind: string;
  bundle_id: string | null;
  file_name: string | null;
  payload: unknown;
  created_at: string;
}

function rowToJson(row: ContentRow, payload: LessonPayload) {
  return {
    id: row.id,
    lesson_id: row.lesson_id,
    owner_user_id: row.owner_user_id,
    grade: row.grade,
    subject: row.subject,
    source: row.source,
    kind: row.kind,
    bundle_id: row.bundle_id,
    file_name: row.file_name,
    payload,
    created_at: row.created_at,
    created: false as boolean,
  };
}

/**
 * POST { fromId, kind }
 * Returns existing sibling of the same bundle for the requested kind,
 * or generates + saves one for reuse.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bad_body", message: "Cần fromId (số) và kind hợp lệ." },
      { status: 400 }
    );
  }
  const { fromId, kind: targetKind } = parsed.data;

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "no_database", message: DB_NOT_CONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const sources = (await db`
      SELECT id, lesson_id, owner_user_id, grade, subject, source, kind, bundle_id, file_name, payload, created_at
      FROM lesson_content
      WHERE id = ${fromId} AND owner_user_id = ${userId}
      LIMIT 1
    `) as unknown as ContentRow[];

    if (sources.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const source = sources[0];
    const sourcePayloadParsed = LessonPayloadSchema.safeParse(source.payload);
    if (!sourcePayloadParsed.success) {
      return NextResponse.json({ error: "bad_payload" }, { status: 500 });
    }
    const sourcePayload = sourcePayloadParsed.data;

    // Already the right kind
    if (source.kind === targetKind) {
      return NextResponse.json({
        content: { ...rowToJson(source, sourcePayload), created: false },
      });
    }

    // Ensure source has a bundle_id (backfill)
    let bundleId = source.bundle_id;
    if (!bundleId) {
      bundleId = randomUUID();
      await db`
        UPDATE lesson_content
        SET bundle_id = ${bundleId}
        WHERE id = ${source.id} AND owner_user_id = ${userId}
      `;
    }

    // Look up sibling
    const siblings = (await db`
      SELECT id, lesson_id, owner_user_id, grade, subject, source, kind, bundle_id, file_name, payload, created_at
      FROM lesson_content
      WHERE owner_user_id = ${userId}
        AND bundle_id = ${bundleId}
        AND kind = ${targetKind}
      ORDER BY created_at DESC
      LIMIT 1
    `) as unknown as ContentRow[];

    if (siblings.length > 0) {
      const sib = siblings[0];
      const sibPayload = LessonPayloadSchema.safeParse(sib.payload);
      if (sibPayload.success) {
        return NextResponse.json({
          content: { ...rowToJson(sib, sibPayload.data), created: false },
        });
      }
    }

    // Derive or generate
    let newPayload: LessonPayload =
      deriveSiblingWithoutLlm(sourcePayload, targetKind) ??
      (await generateSiblingKindContent(sourcePayload, targetKind));

    // Keep meta aligned with source row
    newPayload = {
      ...newPayload,
      grade: (source.grade as LessonPayload["grade"]) ?? newPayload.grade,
      subject:
        (source.subject as LessonPayload["subject"]) ??
        newPayload.subject ??
        "chemistry",
    };

    const inserted = (await db`
      INSERT INTO lesson_content (
        lesson_id, owner_user_id, grade, subject, source, kind, bundle_id, file_name, payload
      )
      VALUES (
        NULL,
        ${userId},
        ${source.grade},
        ${source.subject ?? "chemistry"},
        'ai',
        ${targetKind},
        ${bundleId},
        ${source.file_name},
        ${JSON.stringify(newPayload)}::jsonb
      )
      RETURNING id, lesson_id, owner_user_id, grade, subject, source, kind, bundle_id, file_name, payload, created_at
    `) as unknown as ContentRow[];

    const row = inserted[0];
    return NextResponse.json({
      content: { ...rowToJson(row, newPayload), created: true },
    });
  } catch (err) {
    const msg =
      err instanceof Error && err.message.includes("Chưa cấu hình AI")
        ? "AI chưa được cấu hình (thiếu GEMINI_API_KEY)."
        : err instanceof Error && err.message.length < 160
          ? err.message
          : "Không tạo được nội dung cho chế độ này.";
    return NextResponse.json({ error: "fallback", message: msg }, { status: 200 });
  }
}
