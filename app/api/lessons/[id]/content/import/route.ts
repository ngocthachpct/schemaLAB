import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getLesson } from "@/lib/lessons";
import { generateLessonContent } from "@/lib/gemini";
import {
  ContentKindSchema,
  type ContentKind,
  type LessonPayload,
} from "@/lib/content";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 500_000; // 500 KB

/**
 * POST multipart/form-data { file, kind }
 * kind: lab | theory | flashcards (maps to study mode Lab / Học Bài / Ôn Tập)
 * Gemini system prompt depends on kind → Zod LessonPayload → lesson_content row.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lesson = getLesson(id);
  if (!lesson) {
    return NextResponse.json({ error: "unknown_lesson" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_form" }, { status: 400 });
  }

  const kindRaw = String(form.get("kind") ?? "lab");
  const kindParsed = ContentKindSchema.safeParse(kindRaw);
  if (!kindParsed.success) {
    return NextResponse.json(
      {
        error: "bad_kind",
        message: "Chọn chức năng hợp lệ: lab, theory hoặc flashcards.",
      },
      { status: 400 }
    );
  }
  const kind: ContentKind = kindParsed.data;

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
    payload = await generateLessonContent(lesson, text, kind);
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
        payload, // still return so client can preview if needed
      },
      { status: 503 }
    );
  }

  try {
    const inserted = (await db`
      INSERT INTO lesson_content (lesson_id, source, kind, file_name, payload)
      VALUES (${lesson.id}, 'ai', ${payload.kind}, ${fileName}, ${JSON.stringify(payload)}::jsonb)
      RETURNING id, lesson_id, source, kind, file_name, payload, created_at
    `) as unknown as {
      id: number;
      lesson_id: string;
      source: string;
      kind: string;
      file_name: string | null;
      payload: unknown;
      created_at: string;
    }[];
    const row = inserted[0];
    return NextResponse.json({
      content: {
        id: row.id,
        lesson_id: row.lesson_id,
        source: row.source,
        kind: row.kind,
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
