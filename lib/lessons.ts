export type Grade = "8" | "9";
export type Subject = "chemistry";

export interface Lesson {
  id: string; // "hh8-1"
  grade: Grade;
  subject: Subject;
  order: number;
  title: string;
  description: string;
  /** Static SGK content shipped with the app: lesson experiments */
  defaultPairs: readonly (readonly [string, string])[];
}

export const GRADES: readonly { id: Grade; label: string }[] = [
  { id: "8", label: "Lớp 8" },
  { id: "9", label: "Lớp 9" },
];

export const SUBJECTS: readonly { id: Subject; label: string; icon: string }[] =
  [{ id: "chemistry", label: "Hóa học", icon: "⚗️" }];

/**
 * SGK-aligned lesson catalog (fixed, no DB needed).
 * Curriculum content that requires review to be marked with TODO(verify).
 */
export const LESSONS: readonly Lesson[] = [
  {
    id: "hh8-1",
    grade: "8",
    subject: "chemistry",
    order: 1,
    title: "Hiđrô và tính chất của hiđrô",
    description: "Phản ứng tạo khí H2 từ axit loãng, thử thách với kim loại không tan.",
    defaultPairs: [
      ["hcl", "zn"],
      ["hcl", "mg"],
      ["h2so4", "mg"],
      ["h2so4", "fe"],
      ["cu", "hcl"], // no-reaction demo
    ],
  },
  {
    id: "hh8-2",
    grade: "8",
    subject: "chemistry",
    order: 2,
    title: "Axit và muối cacbonat",
    description: "Sủi bọt khí CO2 khi axit tác dụng với muối cacbonat.",
    defaultPairs: [
      ["hcl", "na2co3"],
      ["h2so4", "na2co3"],
      ["hcl", "nacl"], // no-reaction demo
    ],
  },
  {
    id: "hh8-3",
    grade: "8",
    subject: "chemistry",
    order: 3,
    title: "Sắt và hợp chất của sắt",
    description: "Tính chất hóa học của sắt với axit, dung dịch muối và bazơ.",
    defaultPairs: [
      ["fe", "hcl"],
      ["cuso4", "fe"],
      ["fecl3", "naoh"],
      ["fe", "zn"], // no-reaction demo: hai kim loại trộn nhau không phản ứng
    ],
  },
  {
    id: "hh9-1",
    grade: "9",
    subject: "chemistry",
    order: 1,
    title: "Axit, bazơ và muối",
    description: "Trung hoà axit–bazơ, nhận biết muối bằng kết tủa đặc trưng.",
    defaultPairs: [
      ["hcl", "naoh"],
      ["h2so4", "naoh"],
      ["agno3", "hcl"],
      ["bacl2", "h2so4"],
      ["agno3", "nacl"],
      ["nacl", "naoh"], // no-reaction demo
    ],
  },
  {
    id: "hh9-2",
    grade: "9",
    subject: "chemistry",
    order: 2,
    title: "Tính chất hóa học của muối",
    description: "Phản ứng trao đổi tạo kết tủa giữa các dung dịch muối.",
    defaultPairs: [
      ["cuso4", "naoh"],
      ["agno3", "nacl"],
      ["bacl2", "na2co3"],
      ["caoh2", "na2co3"],
      ["hcl", "na2co3"],
      ["fecl3", "naoh"],
      ["bacl2", "h2so4"],
    ],
  },
  {
    id: "hh9-3",
    grade: "9",
    subject: "chemistry",
    order: 3,
    title: "Dãy hoạt động hóa học của kim loại",
    description: "Phản ứng thế: kim loại mạnh đẩy kim loại yếu khỏi muối.",
    defaultPairs: [
      ["cuso4", "fe"],
      ["cuso4", "zn"],
      ["zn", "agno3"],
      ["hcl", "zn"],
      ["hcl", "mg"],
      ["cu", "h2so4"], // no-reaction demo
    ],
  },
];

export function lessonsByGrade(grade: Grade): Lesson[] {
  return LESSONS.filter((l) => l.grade === grade).sort((a, b) => a.order - b.order);
}

export function getLesson(id: string | null | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Static content id format: "static:<lessonId>" */
export const STATIC_CONTENT_PREFIX = "static:";

export function isStaticContent(cid: string | null | undefined): cid is string {
  return typeof cid === "string" && cid.startsWith(STATIC_CONTENT_PREFIX);
}
