import type { ContentKind, CustomImportContext } from "@/lib/content";
import type { Lesson } from "@/lib/lessons";

/** Shared reagent catalog block for all import modes (ids must match lib/reagents.ts). */
export function reagentCatalogBlock(): string {
  return [
    "CATALOG HÓA CHẤT HỢP LỆ (CHỈ dùng id trong bảng này, không tự tạo id mới):",
    "id | formula | nameVi | group",
    "hcl | HCl | Axit clohiđric | acid_base",
    "h2so4 | H2SO4 | Axit sunfuric loãng | acid_base",
    "naoh | NaOH | Natri hiđroxit | acid_base",
    "caoh2 | Ca(OH)2 | Nước vôi trong | acid_base",
    "cuso4 | CuSO4 | Đồng(II) sunfat | salt",
    "bacl2 | BaCl2 | Bari clorua | salt",
    "na2co3 | Na2CO3 | Natri cacbonat | salt",
    "agno3 | AgNO3 | Bạc nitrat | salt",
    "nacl | NaCl | Natri clorua | salt",
    "fecl3 | FeCl3 | Sắt(III) clorua | salt",
    "fe | Fe | Sắt | metal",
    "zn | Zn | Kẽm | metal",
    "mg | Mg | Magie | metal",
    "cu | Cu | Đồng | metal",
  ].join("\n");
}

function lessonContext(lesson: Lesson): string {
  const pairs = lesson.defaultPairs.map(([a, b]) => `${a} + ${b}`).join("\n");
  return [
    `Bài học mục tiêu trong app:`,
    `- lesson_id: ${lesson.id}`,
    `- grade: ${lesson.grade}`,
    `- title: ${lesson.title}`,
    `- description: ${lesson.description}`,
    `- defaultPairs gợi ý (có thể điều chỉnh theo tài liệu, nhưng vẫn phải ∈ catalog):`,
    pairs,
  ].join("\n");
}

function customContext(ctx: CustomImportContext): string {
  return [
    "Ngữ cảnh bài tự tạo (không gắn bài SGK catalog):",
    `- grade: lớp ${ctx.grade}`,
    `- subject: hóa học THCS`,
    `- kind: ${ctx.kind}`,
    "Đọc tài liệu và tạo nội dung phù hợp khối lớp + chức năng; title/note do AI đặt theo tài liệu.",
  ].join("\n");
}

const SHARED_RULES = [
  "Bạn là giáo viên Hóa học THCS Việt Nam.",
  "Chỉ dùng kiến thức đúng chương trình THCS; không bịa phản ứng.",
  "Mọi id hóa chất phải thuộc catalog. pair dùng {\"a\":\"id\",\"b\":\"id\"}, a ≠ b.",
  "Giọng thân thiện học sinh lớp 8–9, tiếng Việt.",
  "Không hướng dẫn điều chế chất nguy hiểm ngoài đời; chỉ giải thích bản chất.",
  "Chỉ trả về JSON thuần (không markdown, không giải thích ngoài JSON).",
].join("\n");

function schemaForKind(kind: ContentKind, cardIdPrefix: string): string {
  if (kind === "theory") {
    return JSON.stringify(
      {
        kind: "theory",
        title: "string ≤120",
        note: "string ≤600",
        grade: "8|9",
        subject: "chemistry",
        pairs: [{ a: "reagent_id", b: "reagent_id" }],
        theory: {
          summary: "tóm tắt ≤800",
          sections: [{ heading: "≤120", body: "≤1200", tip: "optional ≤300" }],
          remember: ["điểm cần nhớ ≤200"],
        },
      },
      null,
      2
    );
  }
  if (kind === "flashcards") {
    return JSON.stringify(
      {
        kind: "flashcards",
        title: "Ôn tập — ...",
        note: "string ≤600",
        grade: "8|9",
        subject: "chemistry",
        pairs: [{ a: "reagent_id", b: "reagent_id" }],
        cards: [
          {
            id: `${cardIdPrefix}-01`,
            front: "Câu hỏi ≤280?",
            back: "Đáp án ≤500",
            tag: "Lý thuyết|Thí nghiệm|Không phản ứng|An toàn|Quiz",
          },
        ],
      },
      null,
      2
    );
  }
  return JSON.stringify(
    {
      kind: "lab",
      title: "string ≤120",
      note: "string ≤600",
      grade: "8|9",
      subject: "chemistry",
      pairs: [{ a: "reagent_id", b: "reagent_id" }],
    },
    null,
    2
  );
}

function taskForKind(kind: ContentKind): string[] {
  if (kind === "theory") {
    return [
      "CHỨC NĂNG: theory — tạo giáo án lý thuyết để lưu DB và trang Học lý thuyết tái sử dụng.",
      "Nhiệm vụ: đọc tài liệu, viết lý thuyết đúng trọng tâm (không lan man).",
      "Đồng thời chọn 1–8 pairs thí nghiệm minh họa (nếu có) để sau này mở Lab.",
      "Yêu cầu theory.sections: 2–6 mục; theory.remember: 3–6 ý ngắn.",
    ];
  }
  if (kind === "flashcards") {
    return [
      "CHỨC NĂNG: flashcards — tạo bộ câu hỏi/đáp án flash card để lưu DB.",
      "Mỗi thẻ: front = CÂU HỎI rõ (không dùng 'Ghi nhớ #1'); back = đáp án + giải thích ngắn.",
      "Phân bố: 3–5 Lý thuyết, 3–6 Thí nghiệm, 1–2 Không phản ứng (nếu có), 1–2 An toàn — tổng 8–14 thẻ.",
      "Cũng trả pairs (1–12) để bộ nội dung dùng lại được ở Lab.",
      "tag chỉ một trong: Lý thuyết | Thí nghiệm | Không phản ứng | An toàn | Quiz",
      "Phương trình cân bằng; ↓ kết tủa; ↑ khí.",
    ];
  }
  return [
    "CHỨC NĂNG: lab — tạo bộ thí nghiệm để lưu DB và mở Phòng thí nghiệm.",
    "Nhiệm vụ: đọc tài liệu, chọn 1–12 cặp thí nghiệm phù hợp.",
    "Ưu tiên hiện tượng rõ (kết tủa, khí, đổi màu, tỏa nhiệt). Có thể thêm ≤2 cặp không phản ứng.",
  ];
}

function assemblePrompt(
  kind: ContentKind,
  contextBlock: string,
  fileText: string,
  cardIdPrefix: string
): string {
  return [
    SHARED_RULES,
    "",
    ...taskForKind(kind),
    "",
    contextBlock,
    "",
    reagentCatalogBlock(),
    "",
    "Schema JSON BẮT BUỘC (khớp lesson_content.payload):",
    schemaForKind(kind, cardIdPrefix),
    "",
    "NỘI DUNG TÀI LIỆU:",
    "```",
    fileText,
    "```",
  ].join("\n");
}

/** Catalog-linked import (legacy / optional). */
export function buildImportPrompt(
  kind: ContentKind,
  lesson: Lesson,
  fileText: string
): string {
  return assemblePrompt(
    kind,
    lessonContext(lesson),
    fileText.slice(0, 8000),
    lesson.id
  );
}

/** Free-standing user content: grade + subject + kind + file (no catalog lesson). */
export function buildCustomImportPrompt(
  ctx: CustomImportContext,
  fileText: string
): string {
  return assemblePrompt(
    ctx.kind,
    customContext(ctx),
    fileText.slice(0, 8000),
    `u${ctx.grade}`
  );
}

/**
 * Derive another kind from an existing saved payload (no original file).
 * Used when switching mode on an AI-created lesson.
 */
export function buildSiblingKindPrompt(
  targetKind: ContentKind,
  sourceJson: string
): string {
  return [
    SHARED_RULES,
    "",
    ...taskForKind(targetKind),
    "",
    "Nhiệm vụ đặc biệt: dựa trên NỘI DUNG ĐÃ LƯU bên dưới (cùng một bài học của học sinh),",
    `tạo bản payload mới với kind="${targetKind}". Giữ title/note/grade/subject nhất quán nếu hợp lý.`,
    "Tái sử dụng pairs đã có khi phù hợp; chỉ đổi/bổ sung nếu cần cho kind mới.",
    "Không bịa hóa chất ngoài catalog.",
    "",
    reagentCatalogBlock(),
    "",
    "Schema JSON BẮT BUỘC:",
    schemaForKind(targetKind, "sib"),
    "",
    "NỘI DUNG ĐÃ LƯU (JSON):",
    "```json",
    sourceJson.slice(0, 8000),
    "```",
  ].join("\n");
}
