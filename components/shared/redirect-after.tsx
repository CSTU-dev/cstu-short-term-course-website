"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Client-side redirect to `to` after `seconds` (used by the course 404). */
export function RedirectAfter({
  to,
  seconds = 5,
}: {
  to: string;
  seconds?: number;
}) {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => router.replace(to), seconds * 1000);
    return () => clearTimeout(timer);
  }, [router, to, seconds]);
  return null;
}
