import { headers } from "next/headers";

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";

const log = createLogger("rate-limit");

export interface RateLimitRule {
  /** Max allowed hits within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/** Named rules so thresholds live in one place. */
export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 60_000 }, // 10 / min per IP
  signup: { limit: 5, windowMs: 60_000 }, // 5 / min per IP
  resendVerification: { limit: 3, windowMs: 10 * 60_000 }, // 3 / 10 min per user
  adminInvite: { limit: 5, windowMs: 60 * 60_000 }, // 5 / h per target email
  passwordResetIp: { limit: 5, windowMs: 15 * 60_000 }, // 5 / 15 min per IP
  passwordResetEmail: { limit: 3, windowMs: 60 * 60_000 }, // 3 / h per email
  referralClick: { limit: 30, windowMs: 60_000 }, // 30 / min per IP
} as const satisfies Record<string, RateLimitRule>;

/**
 * Fixed-window rate limit backed by Postgres (shared across instances). Returns
 * `{ ok: true }` when the hit is allowed, or `{ ok: false, retryAfterSec }` when
 * the window is exhausted. Fails **open** on DB errors — a limiter outage must
 * not lock users out of auth.
 */
export async function rateLimit(
  key: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + rule.windowMs);
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimit.findUnique({ where: { key } });

      // No row, or the previous window has elapsed → start a fresh window.
      if (!existing || existing.windowEnd <= now) {
        await tx.rateLimit.upsert({
          where: { key },
          create: { key, count: 1, windowEnd },
          update: { count: 1, windowEnd },
        });
        return { ok: true, remaining: rule.limit - 1 };
      }

      if (existing.count >= rule.limit) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil((existing.windowEnd.getTime() - now.getTime()) / 1000),
        );
        return { ok: false, retryAfterSec };
      }

      const updated = await tx.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
      return { ok: true, remaining: Math.max(0, rule.limit - updated.count) };
    });
  } catch (err) {
    log.error({ err, key }, "rate limiter error — failing open");
    return { ok: true, remaining: rule.limit };
  }
}

/**
 * Best-effort client IP from a `Headers` object (Cloud Run sets
 * `x-forwarded-for`). Falls back to a constant so a missing header degrades to a
 * shared bucket rather than throwing. Works in any runtime given a `Headers`.
 */
export function ipFromHeaders(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Best-effort client IP for Server Actions / RSC, reading the request headers
 * via `next/headers`. Prefer {@link ipFromHeaders} when you already hold a
 * `Headers` (route handlers, Auth.js `authorize`).
 */
export async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

/**
 * Delete rate-limit rows whose window has fully elapsed (N11). Active keys reset
 * their own window on the next hit, but keys that never recur leave dead rows
 * that would otherwise accumulate unbounded. Safe to run any time — a later hit
 * re-creates the row via upsert. Intended to be called from a scheduled cron
 * route. Returns the number of rows removed.
 */
export async function cleanupRateLimits(): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({
    where: { windowEnd: { lt: new Date() } },
  });
  return count;
}

/** Human-friendly "try again in …" fragment for error messages. */
export function retryAfterMessage(sec: number): string {
  if (sec >= 60) return `about ${Math.ceil(sec / 60)} minute(s)`;
  return `${sec} second(s)`;
}
