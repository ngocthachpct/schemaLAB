"use client";

import { Suspense } from "react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Header auth controls — no-ops visually when Clerk env is missing. */
export function ClerkChrome() {
  if (!hasClerk) {
    return (
      <span className="sticker-chip bg-paper-deep px-2 py-1 text-[10px] text-ink-soft">
        Chưa cấu hình Clerk
      </span>
    );
  }

  return (
    <Suspense fallback={null}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="sticker-btn bg-mustard px-3 py-1.5 text-xs text-ink">
            Đăng nhập
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </Suspense>
  );
}

export function ClerkMineGate({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  if (!hasClerk) {
    return (
      <div className="sticker-flat bg-paper-deep px-4 py-4 text-sm font-semibold text-ink">
        Cần cấu hình Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) để dùng Bài của
        tôi.
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <Show when="signed-in" fallback={fallback}>
        {children}
      </Show>
    </Suspense>
  );
}
