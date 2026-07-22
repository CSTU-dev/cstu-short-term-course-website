import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * A precomputed valid bcrypt hash. When a login is attempted for a
 * non-existent account (or one with no password), compare against this so both
 * branches spend roughly the same time in bcrypt — otherwise the response
 * timing leaks whether an email is registered (N4 / timing oracle).
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$yeWAqysG0RTUxUEEefM1/O9Pl9X.ztFNmJe1jEhEwVxgvQO7eFMR2";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
