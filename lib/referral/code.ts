import { customAlphabet } from "nanoid";

import { REFERRAL_CODE_LENGTH } from "@/lib/constants";

// Unambiguous alphabet (no 0/O/1/I/l) for generated codes.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(ALPHABET, REFERRAL_CODE_LENGTH);

export function generateReferralCode() {
  return generate();
}

/** Allowed shape for user-customized codes. */
export const REFERRAL_CODE_REGEX = /^[A-Za-z0-9_-]{4,32}$/;

/**
 * Codes users may not claim: they'd let a link impersonate the platform or
 * staff in a share URL (N6). Compared case-insensitively.
 */
const RESERVED_CODES = new Set([
  "admin",
  "administrator",
  "cstu",
  "official",
  "support",
  "help",
  "staff",
  "root",
  "system",
  "superadmin",
]);

export function isReservedReferralCode(code: string): boolean {
  return RESERVED_CODES.has(code.trim().toLowerCase());
}
