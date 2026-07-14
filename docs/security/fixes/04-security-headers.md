# Fix area: HTTP security headers

**Status:** **FAIL**  
**Severity:** MEDIUM  
**Related checklist IDs:** H1–H2  
**Key file:** `next.config.ts` (currently empty of headers)

---

## Problem

`next.config.ts` does not set security headers. Unless the reverse proxy adds them, the site lacks:

| Header | Purpose |
|--------|---------|
| `Content-Security-Policy` | Mitigate XSS / data injection |
| `Strict-Transport-Security` | Force HTTPS (production) |
| `X-Frame-Options` or CSP `frame-ancestors` | Clickjacking |
| `X-Content-Type-Options: nosniff` | MIME sniffing |
| `Referrer-Policy` | Limit Referer leakage (also helps invite tokens in URLs) |
| `Permissions-Policy` | Disable unused browser features |

---

## Recommended fix

Add `headers()` in `next.config.ts` and/or configure nginx/Caddy/Cloudflare.

Example direction (tune CSP to allow Stripe.js, Google OAuth, your domains):

```ts
headers: async () => [
  {
    source: "/:path*",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // Production only:
      // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      // CSP: start report-only, then enforce
    ],
  },
];
```

Also terminate TLS at the edge and redirect HTTP → HTTPS.

---

## Acceptance criteria

- [ ] Baseline headers present on HTML responses
- [ ] CSP does not break Stripe Checkout / OAuth (test both)
- [ ] HSTS enabled only when HTTPS is correctly configured
- [ ] Document whether headers are set in Next vs reverse proxy (avoid duplicates/conflicts)
