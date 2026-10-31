"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/** When signed in, copy Clerk display name into notebook nickname if empty. */
export function PrefillNickname({
  hasName,
  setNickname,
}: {
  hasName: boolean;
  setNickname: (name: string) => void;
}) {
  const { user } = useUser();

  useEffect(() => {
    if (!user || hasName) return;
    const name =
      user.fullName?.trim() ||
      user.firstName?.trim() ||
      user.username?.trim() ||
      "";
    if (name && name.length <= 40) setNickname(name);
  }, [user, hasName, setNickname]);

  return null;
}
