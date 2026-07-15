# Fix area: Input validation — video URL / stored XSS

**Status:** **FAIL**  
**Severity:** MEDIUM  
**Related checklist IDs:** V4  
**Key files:** `lib/validations/course.ts`, `app/(user)/my/courses/[id]/page.tsx`

---

## Problem

Section `videoUrl` is validated with a generic URL schema (`z.url()`), which can allow dangerous schemes such as `javascript:` or `data:` depending on Zod/URL parsing behavior.

Paid course pages render the value as a link:

```tsx
<a href={s.videoUrl}>...</a>
```

**Impact:** A malicious or compromised admin could store a dangerous URL that executes in a learner’s browser when clicked (stored XSS / drive-by). Risk is gated by admin privileges but still material for an education platform.

---

## Recommended fixes

1. Restrict to `https:` only (optionally `http:` in development).
2. Reject `javascript:`, `data:`, `vbscript:`, and empty/relative schemes.
3. Optionally allowlist hosts (e.g. YouTube, Vimeo, your CDN).
4. Consider `rel="noopener noreferrer"` on external links (already good practice).

Example Zod direction:

```ts
videoUrl: z
  .string()
  .url()
  .refine((u) => /^https:\/\//i.test(u), { message: "HTTPS URLs only" })
```

---

## Acceptance criteria

- [ ] Non-https schemes rejected at validation time
- [ ] Existing bad data cleaned or blocked at render time
- [ ] Unit tests for `javascript:` / `data:` rejection
