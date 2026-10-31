import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Baloo_2, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

const bevietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bevietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChemLab AI – Phòng Thí Nghiệm Hóa Học Ảo",
  description:
    "Mô phỏng thí nghiệm hóa học 2D cho học sinh THCS: trộn hóa chất, xem hiện tượng, đọc phân tích và lưu Sổ tay thí nghiệm.",
};

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <html lang="vi" className={`${baloo.variable} ${bevietnam.variable}`}>
      <body className="font-body paper-bg min-h-screen">{children}</body>
    </html>
  );

  if (!hasClerk) return body;

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/hoc"
    >
      {body}
    </ClerkProvider>
  );
}
