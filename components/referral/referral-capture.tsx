"use client";

import { useEffect } from "react";

import { REFERRAL_QUERY_PARAM, REFERRAL_STORAGE_KEY } from "@/lib/constants";

/**
 * Captures a `?ref=` code on page load: validates it server-side, and only on
 * success stores it in localStorage (a new valid code overwrites an old one;
 * invalid codes are ignored).
 */
export function ReferralCapture() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get(REFERRAL_QUERY_PARAM);
    if (!code) return;

    const parts = url.pathname.split("/");
    const courseSlug =
      parts[1] === "courses" && parts[2] ? parts[2] : undefined;

    fetch("/api/referral/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, courseSlug }),
    })
      .then((r) => r.json())
      .then((data: { valid?: boolean }) => {
        if (data?.valid) {
          window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
        }
      })
      .catch(() => {
        // network error — leave any existing stored code untouched
      });
  }, []);

  return null;
}
