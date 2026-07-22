/**
 * Constrain a user-supplied `redirectTo` to a same-site path, defeating open
 * redirects (A7). Accepts only values that start with a single "/" and are not
 * protocol-relative ("//host") or scheme URLs ("https://…", "javascript:").
 * Anything else falls back to the caller's default.
 */
export function safeRedirect(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  // Must be an absolute path on this site: single leading slash, no backslash
  // tricks, and no scheme.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
