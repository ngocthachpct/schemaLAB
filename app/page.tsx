"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Beaker } from "@/components/lab/Beaker";
import { NicknameDialog } from "@/components/NicknameDialog";
import { BadgeChip } from "@/components/notebook/BadgeChip";
import { Sparkle } from "@/components/decor/Sparkle";
import { ToastStack } from "@/components/ToastStack";
import { useNotebook } from "@/hooks/useNotebook";

const STEPS = [
  {
    icon: "1️⃣",
    title: "Đăng nhập",
    text: "Chọn cho mình một biệt danh — không cần mật khẩu, không đăng ký lằng nhằng.",
  },
  {
    icon: "2️⃣",
    title: "Chọn khối lớp & bài học",
    text: "Lớp 8 hoặc Lớp 9, môn Hóa học, rồi chọn bài học cần thực hành.",
  },
  {
    icon: "3️⃣",
    title: "Vào lab",
    text: "Trộn 2 hóa chất, xem hiện tượng: đổi màu, sủi bọt, kết tủa, tỏa nhiệt!",
  },
  {
    icon: "4️⃣",
    title: "Đọc phân tích AI",
    text: "Phương trình, ion rút gọn, giải thích bản chất và cảnh báo an toàn.",
  },
  {
    icon: "5️⃣",
    title: "Lưu Sổ tay",
    text: "Phản ứng đã khám phá được lưu vào Sổ tay, mở khóa danh hiệu Nhà Giả Kim Nhí.",
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const notebook = useNotebook();
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Avoid hydration mismatch: only render the nickname-dependent CTA after mount
  useEffect(() => {
    setHydrated(true);
  }, []);

  const start = (): void => {
    if (notebook.hasName) {
      router.push("/hoc");
    } else {
      setNicknameOpen(true);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1100px] flex-col gap-8 p-4 lg:p-8">
      {/* ================= Hero ================= */}
      <header className="relative flex flex-wrap items-center gap-3">
        <div className="sticker-chip rot-neg bg-mustard px-4 py-2">
          <span className="text-lg" aria-hidden>
            🧪
          </span>
          <span className="font-display text-lg font-extrabold leading-none tracking-wide">
            CHEMLAB
          </span>
          <span className="rounded-full bg-ink px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-mustard">
            AI
          </span>
        </div>
        <Sparkle tone="#e07a5f" />
        <Sparkle tone="#3f9e8d" size={18} delay="0.9s" />
        <div className="ml-auto">
          <Link href="/hoc" className="sticker-btn bg-teal-soft px-4 py-2 text-sm text-ink">
            📚 Đi tới bài học
          </Link>
        </div>
      </header>

      <section className="card-sticker relative overflow-hidden p-6 lg:p-10">
        {/* Sunburst backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            right: -160,
            top: -160,
            width: 460,
            height: 460,
            background:
              "repeating-conic-gradient(from -6deg at 50% 50%, rgba(242,193,78,0.28) 0deg 8deg, transparent 8deg 24deg)",
          }}
        />
        <div className="relative flex flex-col items-center gap-8 lg:flex-row">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="font-display text-3xl font-extrabold leading-tight text-ink lg:text-5xl">
              Phòng thí nghiệm hóa học{" "}
              <span className="relative inline-block text-terracotta">
                ảo
                <svg
                  aria-hidden
                  viewBox="0 0 100 10"
                  className="absolute -bottom-1 left-0 h-2.5 w-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 6 Q 15 2, 30 6 T 60 6 T 98 5"
                    fill="none"
                    stroke="#3f9e8d"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              cho học sinh THCS
            </h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-ink-soft">
              Chọn 2 hóa chất, đổ vào cốc và xem hiện tượng thật mắt: bọt khí
              sủi tách tách, kết tủa rơi như tuyết, khói tỏa lên... Không lo
              cháy nổ, không cần mua hóa chất — lý thuyết SGK được AI phân tích
              tận tình.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button
                type="button"
                onClick={start}
                className="sticker-btn bg-terracotta px-6 py-3 text-base text-white"
              >
                🚀 {hydrated && notebook.hasName ? "Tiếp tục" : "Đăng nhập để tiếp tục"}
              </button>
              {hydrated && (
                <div className="flex items-center gap-2">
                  <BadgeChip badgeLabel={notebook.badgeLabel} count={notebook.count} />
                  {notebook.hasName && (
                    <span className="sticker-chip bg-paper px-3 py-1.5 text-xs text-ink-soft">
                      👤 {notebook.nickname}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="mt-3 text-xs font-semibold text-ink-soft">
              Miễn phí hoàn toàn — chỉ cần biệt danh, không cần tài khoản email.
            </p>
          </div>

          {/* Illustrated hero beaker */}
          <div className="relative flex-shrink-0">
            <Sparkle className="absolute -left-8 top-2" tone="#f2c14e" delay="0.2s" size={26} />
            <Sparkle className="absolute -right-6 top-14" tone="#e07a5f" delay="1.1s" size={20} />
            <Beaker
              key="hero"
              liquidColor="#7dd3fc"
              liquidLevel={62}
              hasGas
              gasColor="#ffffff"
              hasPrecipitate
              precipitateColor="#3b82f6"
              heat="normal"
              solidPiece={null}
            />
          </div>
        </div>
      </section>

      {/* ================= Hướng dẫn (5 bước) ================= */}
      <section aria-label="Hướng dẫn sử dụng">
        <h2 className="font-display text-center text-2xl font-extrabold text-ink">
          5 bước để trở thành{" "}
          <span className="wavy-underline">Nhà Giả Kim Nhí</span>
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <div
                className={`card-sticker h-full p-4 ${i % 2 === 0 ? "rot-neg" : "rot-pos"}`}
              >
                <div className="font-display text-2xl">{s.icon}</div>
                <h3 className="font-display mt-1 text-base font-extrabold text-ink">
                  {s.title}
                </h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-ink-soft">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= An toàn banner ================= */}
      <section className="card-sticker p-5" style={{ backgroundColor: "#fde2d8" }}>
        <p className="font-display flex items-center justify-center gap-2 text-center text-base font-extrabold text-[#b3402a]">
          ⚠️ Lưu ý an toàn quan trọng
        </p>
        <p className="mt-2 text-center text-sm font-semibold leading-relaxed text-[#8a2c1d]">
          Tất cả thí nghiệm ở đây chỉ là{" "}
          <b>mô phỏng ảo để học</b>. Ở ngoài đời thật, hóa chất có thể cháy nổ,
          ăn da và nguy hiểm tính mạng —{" "}
          <b>tuyệt đối không tự thực hiện thí nghiệm nào ngoài phòng thí
          nghiệm có giáo viên hướng dẫn!</b>
        </p>
      </section>

      <ToastStack items={notebook.toasts} onClose={notebook.dismissToast} />

      <NicknameDialog
        open={nicknameOpen}
        initialName={notebook.nickname}
        onSave={(name) => {
          notebook.setNickname(name);
          setNicknameOpen(false);
          router.push("/hoc");
        }}
        onClose={() => setNicknameOpen(false)}
      />
    </main>
  );
}
