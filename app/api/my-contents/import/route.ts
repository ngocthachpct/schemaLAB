import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  ContentKindSchema,
  GradeSchema,
  SubjectSchema,
  type LessonPayload,
} from "@/lib/content";
import { generateCustomLessonContent } from "@/lib/gemini";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 500_000;

/**
 * POST multipart: file, kind, grade, subject
 * Creates free-standing user content (lesson_id = null, owner_user_id = Clerk id).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_form" }, { status: 400 });
  }

  const kindParsed = ContentKindSchema.safeParse(String(form.get("kind") ?? ""));
  const gradeParsed = GradeSchema.safeParse(String(form.get("grade") ?? ""));
  const subjectParsed = SubjectSchema.safeParse(
    String(form.get("subject") ?? "chemistry")
  );

  if (!kindParsed.success || !gradeParsed.success || !subjectParsed.success) {
    return NextResponse.json(
      {
        error: "bad_params",
        message: "Thiếu kind / grade / subject hợp lệ.",
      },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "no_file", message: "Em chưa chọn file nào cả." },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "file_too_big", message: "File hơi to (>500KB). Em thử file nhỏ hơn nhé!" },
      { status: 400 }
    );
  }

  const fileName = file.name.slice(0, 120);
  const lower = fileName.toLowerCase();
  const allowed =
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json") ||
    lower.endsWith(".csv");
  if (!allowed) {
    return NextResponse.json(
      { error: "bad_type", message: "Hiện chỉ nhận file .txt, .md, .json hoặc .csv." },
      { status: 400 }
    );
  }

  const text = Buffer.from(await file.arrayBuffer()).toString("utf8");
  if (text.trim().length < 20) {
    return NextResponse.json(
      { error: "empty_file", message: "File không có nội dung để đọc." },
      { status: 400 }
    );
  }

  let payload: LessonPayload;
  try {
    payload = await generateCustomLessonContent(
      {
        kind: kindParsed.data,
        grade: gradeParsed.data,
        subject: subjectParsed.data,
      },
      text
    );
  } catch (err) {
    const msg =
      err instanceof Error && err.message.includes("Chưa cấu hình AI")
        ? "AI chưa được cấu hình trên máy chủ này (thiếu GEMINI_API_KEY)."
        : err instanceof Error && err.message.length < 160
          ? err.message
          : "AI không đọc hiểu được tài liệu này. Em thử file bài giảng rõ hơn nhé!";
    return NextResponse.json({ error: "fallback", message: msg }, { status: 200 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      {
        error: "no_database",
        message: "Đã tạo nội dung nhưng cần DATABASE_URL để lưu lại.",
        payload,
      },
      { status: 503 }
    );
  }

  try {
    const bundleId = randomUUID();
    const inserted = (await db`
      INSERT INTO lesson_content (
        lesson_id, owner_user_id, grade, subject, source, kind, bundle_id, file_name, payload
      )
      VALUES (
        NULL,
        ${userId},
        ${gradeParsed.data},
        ${subjectParsed.data},
        'ai',
        ${payload.kind},
        ${bundleId},
        ${fileName},
        ${JSON.stringify(payload)}::jsonb
      )
      RETURNING id, lesson_id, owner_user_id, grade, subject, source, kind, bundle_id, file_name, payload, created_at
    `) as unknown as {
      id: number;
      lesson_id: string | null;
      owner_user_id: string;
      grade: string;
      subject: string;
      source: string;
      kind: string;
      bundle_id: string | null;
      file_name: string | null;
      payload: unknown;
      created_at: string;
    }[];

    const row = inserted[0];
    return NextResponse.json({
      content: {
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
      },
    });
  } catch {
    return NextResponse.json(
      { error: "db_error", message: "Không lưu được nội dung vào cơ sở dữ liệu." },
      { status: 500 }
    );
  }
}
