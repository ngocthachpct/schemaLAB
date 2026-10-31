import { NextResponse } from "next/server";
import { GRADES, LESSONS, SUBJECTS } from "@/lib/lessons";

export const runtime = "nodejs";

/** Lesson catalog (static, no DB needed). */
export async function GET() {
  return NextResponse.json({
    grades: GRADES,
    subjects: SUBJECTS,
    lessons: LESSONS.map((l) => ({
      id: l.id,
      grade: l.grade,
      order: l.order,
      title: l.title,
      description: l.description,
    })),
  });
}
