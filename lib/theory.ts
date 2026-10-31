/**
 * Static SGK-aligned theory for each lesson (THCS tone, Vietnamese UI).
 * Mark uncertain chemistry with TODO(verify) in comments only.
 */

export interface TheorySection {
  heading: string;
  body: string;
  tip?: string;
}

export interface LessonTheory {
  lessonId: string;
  summary: string;
  sections: TheorySection[];
  remember: string[];
}

export const LESSON_THEORY: Record<string, LessonTheory> = {
  "hh8-1": {
    lessonId: "hh8-1",
    summary:
      "Hiđrô (H₂) là khí không màu, nhẹ hơn không khí. Ở phòng thí nghiệm, thường thu khí H₂ khi kim loại hoạt động mạnh tác dụng với axit loãng.",
    sections: [
      {
        heading: "Cách tạo khí hiđrô",
        body: "Kim loại đứng trước hiđrô trong dãy hoạt động (như Mg, Zn, Fe) tác dụng với axit loãng (HCl, H₂SO₄) tạo muối và khí H₂ sủi bọt. Ví dụ: Zn + 2HCl → ZnCl₂ + H₂↑.",
        tip: "Nhìn thấy bọt khí trắng mờ bay lên — đó chính là H₂ đang thoát ra.",
      },
      {
        heading: "Khi nào không có khí H₂?",
        body: "Kim loại đứng sau hiđrô (như Cu, Ag) không đẩy được H⁺ khỏi axit loãng ở điều kiện thường. Vì vậy Cu + HCl không phản ứng — không có bọt khí.",
      },
      {
        heading: "An toàn với khí H₂",
        body: "Khí hiđrô dễ cháy, hỗn hợp với không khí có thể nổ khi gặp lửa. Trong lab ảo chỉ quan sát; ngoài đời thật phải tránh nguồn lửa.",
      },
    ],
    remember: [
      "Kim loại mạnh + axit loãng → muối + H₂↑",
      "Cu không tạo H₂ với HCl loãng",
      "H₂ nhẹ hơn không khí và dễ cháy",
    ],
  },
  "hh8-2": {
    lessonId: "hh8-2",
    summary:
      "Muối cacbonat (CO₃²⁻) gặp axit sẽ tạo khí CO₂ — hiện tượng sủi bọt rất dễ nhận biết trong phòng thí nghiệm.",
    sections: [
      {
        heading: "Axit gặp muối cacbonat",
        body: "Axit cung cấp H⁺, muối cacbonat cung cấp CO₃²⁻. Hai ion này tạo thành H₂CO₃ rồi phân hủy thành CO₂↑ và H₂O. Ví dụ: Na₂CO₃ + 2HCl → 2NaCl + CO₂↑ + H₂O.",
        tip: "Thử thổi khí CO₂ vào nước vôi trong (Ca(OH)₂) — dung dịch sẽ đục vì tạo CaCO₃↓.",
      },
      {
        heading: "Không phải muối nào cũng sủi bọt",
        body: "Muối clorua như NaCl không có ion cacbonat nên gặp HCl không tạo CO₂. Không sủi bọt không có nghĩa thí nghiệm sai — đôi khi đúng là không phản ứng!",
      },
    ],
    remember: [
      "Axit + muối cacbonat → muối mới + CO₂↑ + H₂O",
      "Sủi bọt trắng = khí CO₂",
      "NaCl + HCl: không phản ứng đặc trưng",
    ],
  },
  "hh8-3": {
    lessonId: "hh8-3",
    summary:
      "Sắt (Fe) là kim loại hoạt động trung bình: tan trong axit loãng, đẩy được đồng khỏi muối đồng, và ion Fe³⁺ tạo kết tủa nâu đỏ với OH⁻.",
    sections: [
      {
        heading: "Sắt với axit",
        body: "Fe tác dụng với HCl loãng tạo FeCl₂ và khí H₂. Hiện tượng: sủi bọt, dung dịch dần đổi màu nhạt.",
      },
      {
        heading: "Sắt đẩy đồng",
        body: "Fe đứng trước Cu trong dãy hoạt động nên Fe + CuSO₄ → FeSO₄ + Cu↓. Dung dịch xanh của Cu²⁺ nhạt dần, đồng đỏ gạch bám trên thanh sắt.",
      },
      {
        heading: "Nhận biết Fe³⁺",
        body: "FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl. Kết tủa Fe(OH)₃ màu nâu đỏ là dấu hiệu đặc trưng của ion Fe³⁺.",
        tip: "Hai kim loại trộn với nhau (Fe + Zn) ở dạng rắn không phản ứng trong lab này.",
      },
    ],
    remember: [
      "Fe + axit loãng → muối sắt + H₂↑",
      "Fe đẩy Cu²⁺ khỏi dung dịch CuSO₄",
      "Fe(OH)₃↓ nâu đỏ nhận biết Fe³⁺",
    ],
  },
  "hh9-1": {
    lessonId: "hh9-1",
    summary:
      "Axit + bazơ → muối + nước (trung hòa, thường tỏa nhiệt). Muối có thể nhận biết bằng phản ứng tạo kết tủa đặc trưng với thuốc thử.",
    sections: [
      {
        heading: "Phản ứng trung hòa",
        body: "Ion H⁺ từ axit kết hợp với ion OH⁻ từ bazơ tạo nước: H⁺ + OH⁻ → H₂O. Ví dụ: HCl + NaOH → NaCl + H₂O. Cốc ấm lên vì phản ứng tỏa nhiệt.",
      },
      {
        heading: "Nhận biết ion bằng kết tủa",
        body: "Ag⁺ + Cl⁻ → AgCl↓ (trắng). Ba²⁺ + SO₄²⁻ → BaSO₄↓ (trắng). Đây là cách nhận biết ion clorua và sunfat trong chương trình THCS.",
      },
      {
        heading: "Khi trộn muối với bazơ cùng gốc?",
        body: "NaCl + NaOH không tạo kết tủa hay khí mới — hai chất này không phản ứng trao đổi đặc trưng ở điều kiện phòng.",
      },
    ],
    remember: [
      "Trung hòa: axit + bazơ → muối + H₂O (tỏa nhiệt)",
      "AgCl↓ trắng: có ion Cl⁻",
      "BaSO₄↓ trắng: có ion SO₄²⁻",
    ],
  },
  "hh9-2": {
    lessonId: "hh9-2",
    summary:
      "Muối có thể tham gia phản ứng trao đổi với bazơ hoặc muối khác nếu tạo ra kết tủa, khí hoặc chất điện li yếu.",
    sections: [
      {
        heading: "Điều kiện phản ứng trao đổi",
        body: "Hai dung dịch muối (hoặc muối–bazơ) phản ứng khi sản phẩm có kết tủa, khí hoặc nước. Ví dụ CuSO₄ + 2NaOH → Cu(OH)₂↓ xanh lam + Na₂SO₄.",
      },
      {
        heading: "Một số kết tủa hay gặp",
        body: "AgCl↓ trắng, BaCO₃↓ trắng, CaCO₃↓ trắng, Fe(OH)₃↓ nâu đỏ, Cu(OH)₂↓ xanh lam. Màu và dạng kết tủa giúp nhận biết ion.",
        tip: "Trong lab ảo, quan sát màu kết tủa rồi đối chiếu với phương trình ion rút gọn.",
      },
    ],
    remember: [
      "Trao đổi xảy ra nếu có kết tủa / khí / nước",
      "Cu(OH)₂↓ xanh lam; Fe(OH)₃↓ nâu đỏ",
      "Đọc phương trình ion rút gọn để thấy bản chất",
    ],
  },
  "hh9-3": {
    lessonId: "hh9-3",
    summary:
      "Dãy hoạt động hóa học xếp kim loại theo khả năng đẩy nhau khỏi hợp chất. Kim loại mạnh hơn đẩy kim loại yếu hơn khỏi dung dịch muối.",
    sections: [
      {
        heading: "Phản ứng thế kim loại",
        body: "Nếu kim loại A đứng trước kim loại B trong dãy hoạt động thì A có thể đẩy B khỏi muối của B. Ví dụ: Fe + CuSO₄ → FeSO₄ + Cu↓; Zn + CuSO₄ → ZnSO₄ + Cu↓.",
      },
      {
        heading: "Kim loại với axit",
        body: "Kim loại đứng trước H cũng đẩy được H⁺ khỏi axit loãng tạo H₂. Mg, Zn phản ứng mạnh; Cu đứng sau H nên không tạo H₂ với H₂SO₄ loãng ở điều kiện thường.",
      },
      {
        heading: "Ví dụ nâng cao trong lab",
        body: "Zn + 2AgNO₃ → Zn(NO₃)₂ + 2Ag↓ — kẽm đẩy bạc vì Zn mạnh hơn Ag. Đây là cặp hay dùng để thử AI / cache trong ChemLab.",
      },
    ],
    remember: [
      "Kim loại mạnh đẩy kim loại yếu khỏi muối",
      "Đứng trước H → có thể tạo H₂ với axit loãng",
      "Cu không đẩy H khỏi axit loãng",
    ],
  },
};

export function getLessonTheory(lessonId: string | null | undefined): LessonTheory | null {
  if (!lessonId) return null;
  return LESSON_THEORY[lessonId] ?? null;
}
