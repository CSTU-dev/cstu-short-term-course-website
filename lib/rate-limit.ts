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
 * Best-effort client IP from proxy headers (Cloud Run sets `x-forwarded-for`).
 * Falls back to a constant so a missing header degrades to a shared bucket
 * rather than throwing.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

/** Human-friendly "try again in …" fragment for error messages. */
export function retryAfterMessage(sec: number): string {
  if (sec >= 60) return `about ${Math.ceil(sec / 60)} minute(s)`;
  return `${sec} second(s)`;
}
