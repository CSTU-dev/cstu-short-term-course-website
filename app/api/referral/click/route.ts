import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { recordReferralClick, resolveReferralCode } from "@/lib/referral/service";

/**
 * Validate a referral code and (once per rolling window, per code) count a
 * click. Called by <ReferralCapture> on the client. Returns { valid }.
 */
export async function POST(req: Request) {
  let body: { code?: string; courseSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) return NextResponse.json({ valid: false });

  const cookieStore = await cookies();
  const dedupeKey = `ref_seen_${code}`.slice(0, 60);

  if (cookieStore.has(dedupeKey)) {
    const referral = await resolveReferralCode(code);
    return NextResponse.json({ valid: Boolean(referral) });
  }

  const result = await recordReferralClick(code, body.courseSlug);
  const res = NextResponse.json({ valid: result.valid });
  if (result.valid) {
    res.cookies.set(dedupeKey, "1", {
      maxAge: 60 * 60 * 12,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}
