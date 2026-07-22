import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { cleanupRateLimits } from "@/lib/rate-limit";

const log = createLogger("cron-rate-limit-cleanup");

// Postgres access (deleteMany) needs the Node runtime, not the Edge.
export const runtime = "nodejs";
// Never cache; this mutates.
export const dynamic = "force-dynamic";

/**
 * Scheduled cleanup of expired RateLimit rows (N11). Wire this to Cloud
 * Scheduler (or any cron) hitting it ~daily with an `Authorization: Bearer
 * <CRON_SECRET>` header. Fails closed: if CRON_SECRET is unset the route refuses
 * to run, so it can't be triggered anonymously.
 */
async function handle(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await cleanupRateLimits();
  log.info({ deleted }, "rate-limit rows cleaned up");
  return NextResponse.json({ ok: true, deleted });
}

// Cloud Scheduler issues GET by default; allow POST too for flexibility.
export const GET = handle;
export const POST = handle;
