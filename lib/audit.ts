import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("audit");

type AuditAction = Prisma.AuditLogCreateManyInput["action"];

/**
 * Append an audit-log row. Best-effort: failures are logged but never break the
 * business operation. Call inside the same transaction as the change when the
 * audit must be atomic with it (pass a tx client via `client`).
 */
export async function writeAudit(input: {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
  client?: Prisma.TransactionClient;
}) {
  const db = input.client ?? prisma;
  const actorId =
    input.actorId !== undefined
      ? input.actorId
      : ((await auth())?.user?.id ?? null);

  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: (input.before ?? undefined) as Prisma.InputJsonValue,
        after: (input.after ?? undefined) as Prisma.InputJsonValue,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue,
        actorId,
      },
    });
  } catch (error) {
    log.error({ err: error, action: input.action }, "failed to write audit log");
  }
}
