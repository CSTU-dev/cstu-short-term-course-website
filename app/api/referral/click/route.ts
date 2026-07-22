import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ipFromHeaders,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { recordReferralClick, resolveReferralCode } from "@/lib/referral/service";

// Bound the shape/length of the body (V5). The referral service does the real
// existence check; this just rejects obviously malformed input cheaply.
const ClickSchema = z.object({
  code: z.string().trim().min(1).max(64),
  courseSlug: z.string().trim().max(200).optional(),
});

/**
 * Validate a referral code and (once per rolling window, per code) count a
 * click. Called by <ReferralCapture> on the client. Returns { valid }.
 * Rate-limited per IP so the public endpoint can't be scripted to inflate click
 * stats or enumerate codes (R2/C4).
 */
export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = await rateLimit(`refclick:ip:${ip}`, RATE_LIMITS.referralClick);
  if (!limit.ok) {
    return NextResponse.json({ valid: false }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const parsed = ClickSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const { code, courseSlug } = parsed.data;

  const cookieStore = await cookies();
  const dedupeKey = `ref_seen_${code}`.slice(0, 60);

  if (cookieStore.has(dedupeKey)) {
    const referral = await resolveReferralCode(code);
    return NextResponse.json({ valid: Boolean(referral) });
  }

  const result = await recordReferralClick(code, courseSlug);
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
