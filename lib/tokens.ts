import { createHash } from "node:crypto";

/** One-way hash for storing single-use tokens (admin invites, etc.). */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
