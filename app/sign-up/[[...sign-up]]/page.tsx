import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SignUpPage() {
  if (!hasClerk) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <p className="font-display text-lg font-extrabold text-ink">
          Chưa cấu hình Clerk
        </p>
        <p className="max-w-md text-center text-sm text-ink-soft">
          Thêm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY và CLERK_SECRET_KEY vào .env (xem .env.example).
        </p>
        <Link href="/hoc" className="sticker-btn bg-mustard px-4 py-2 text-sm text-ink">
          ← Về trang học
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border-2 border-[#2f2a26] rounded-2xl",
          },
        }}
        fallbackRedirectUrl="/hoc"
      />
    </main>
  );
}
