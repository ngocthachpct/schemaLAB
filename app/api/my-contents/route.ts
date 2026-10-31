import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  CONTENT_KIND_LABEL_VI,
  ContentKindSchema,
  GradeSchema,
  LessonPayloadSchema,
  SubjectSchema,
  type ContentKind,
} from "@/lib/content";
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

/** GET /api/my-contents?grade=&subject=&kind= — list current user's contents */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const gradeRaw = req.nextUrl.searchParams.get("grade");
  const subjectRaw = req.nextUrl.searchParams.get("subject") ?? "chemistry";
  const kindRaw = req.nextUrl.searchParams.get("kind");

  const grade = GradeSchema.safeParse(gradeRaw);
  const subject = SubjectSchema.safeParse(subjectRaw);
  const kind = kindRaw ? ContentKindSchema.safeParse(kindRaw) : null;

  if (!grade.success || !subject.success) {
    return NextResponse.json(
      { error: "bad_query", message: "Cần grade (8|9) và subject hợp lệ." },
      { status: 400 }
    );
  }
  if (kindRaw && kind && !kind.success) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "no_database", message: DB_NOT_CONFIGURED_MESSAGE },
      { status: 503 }
    );
  }

  try {
    const rows = (
      kind?.success
        ? await db`
            SELECT id, lesson_id, owner_user_id, grade, subject, source, kind, file_name, payload, created_at
            FROM lesson_content
            WHERE owner_user_id = ${userId}
              AND grade = ${grade.data}
              AND subject = ${subject.data}
              AND kind = ${kind.data}
            ORDER BY created_at DESC
            LIMIT 40
          `
        : await db`
            SELECT id, lesson_id, owner_user_id, grade, subject, source, kind, file_name, payload, created_at
            FROM lesson_content
            WHERE owner_user_id = ${userId}
              AND grade = ${grade.data}
              AND subject = ${subject.data}
            ORDER BY created_at DESC
            LIMIT 40
          `
    ) as unknown as ContentRow[];

    return NextResponse.json({
      contents: rows.map((r) => {
        const parsed = LessonPayloadSchema.safeParse(r.payload);
        const k = (ContentKindSchema.safeParse(r.kind).success
          ? r.kind
          : "lab") as ContentKind;
        return {
          id: r.id,
          lesson_id: r.lesson_id,
          owner_user_id: r.owner_user_id,
          grade: r.grade,
          subject: r.subject,
          source: r.source,
          kind: k,
          kind_label: CONTENT_KIND_LABEL_VI[k],
          file_name: r.file_name,
          title: parsed.success ? parsed.data.title : "Nội dung chưa rõ",
          note: parsed.success ? parsed.data.note : "",
          created_at: r.created_at,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "db_error", message: "Không tải được danh sách bài của bạn." },
      { status: 500 }
    );
  }
}
