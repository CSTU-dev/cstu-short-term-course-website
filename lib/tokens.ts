import { createHash } from "node:crypto";

import { nanoid } from "nanoid";

import { prisma } from "@/lib/db";
import type { TokenPurpose } from "@/lib/generated/prisma/client";

/** One-way hash for storing single-use tokens (admin invites, etc.). */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** A high-entropy, URL-safe one-time token. */
export function generateToken() {
  return nanoid(32);
}

/** Default lifetimes per purpose. */
export const TOKEN_TTL_MS: Record<TokenPurpose, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24h
  PASSWORD_RESET: 60 * 60 * 1000, // 1h
};

/**
 * Issue a single-use token for a user. Stores only the SHA-256 hash and returns
 * the raw token to embed in a link. Any prior unused tokens of the same purpose
 * are invalidated so only the newest link works.
 */
export async function createUserToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS[purpose]);
  await prisma.$transaction([
    prisma.userToken.updateMany({
      where: { userId, purpose, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.userToken.create({
      data: { userId, purpose, tokenHash: hashToken(token), expiresAt },
    }),
  ]);
  return token;
}

/**
 * Atomically consume a token: valid only if it exists, matches the purpose, is
 * unused, and unexpired. Marks it used and returns the owning `userId`, or null
 * when invalid. The `updateMany` guard makes redemption single-use even under
 * concurrent requests.
 */
export async function consumeUserToken(
  rawToken: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const record = await prisma.userToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (
    !record ||
    record.purpose !== purpose ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return null;
  }
  const claimed = await prisma.userToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return claimed.count === 1 ? record.userId : null;
}
