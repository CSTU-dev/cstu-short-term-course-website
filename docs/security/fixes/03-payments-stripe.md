# Fix area: Payments & Stripe

**Status (2026-07-22):** Problem 1 (refund) **RESOLVED as ledger-only by product
decision** — `recordManualRefund` is documented + UI relabeled "Record ledger
adjustment" with a "does not move money — issue in Stripe" warning; N7 amount
validation added. Problems 2 & 3 **FIXED** — `recordPayment` flags currency
mismatch, amount-vs-net divergence, and duplicate payments (audit
`PAYMENT_ANOMALY` + error log) and conversion is currency-aware (N8,
`lib/payments/currency.ts`).  
**Severity:** HIGH (manual refund) / MEDIUM (amount & double checkout)  
**Related checklist IDs:** P5–P7  
**Key files:** `lib/actions/payment.actions.ts`, `lib/payments/enrollment-state.ts`, `app/webhook/stripe/route.ts`

---

## What already works (do not break)

- Checkout `unitAmount` computed server-side from enrollment `listPrice` / `discountAmount`
- Webhook verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`
- Enrollment marked PAID only after webhook confirms paid status
- Payment idempotency via unique `(provider, externalId)`

---

## Problem 1 — Manual refund is ledger-only (HIGH)

`recordManualRefund` authorizes via `canManageCourse`, then calls `recordRefund()` which updates DB / commission state. It does **not** call `stripe.refunds.create`.

**Impact:** UI/DB can show refunded while Stripe still holds the customer’s money → financial / compliance / trust risk.

**Fix options:**

1. Preferred: create a Stripe Refund for the corresponding PaymentIntent / Charge, then update ledger in the same flow (handle partial refunds).
2. Or rename UI/API to “Record ledger adjustment (no Stripe refund)” and require a separate Stripe Dashboard step — with clear operator warnings and audit trail.

---

## Problem 2 — Webhook does not reconcile amount to expected net price (MEDIUM)

Webhook trusts Stripe session amounts without comparing to `listPrice - discountAmount` on the enrollment.

**Fix:** Reject or flag events where `amount_total` (or paid amount) diverges beyond a small tolerance from the expected cents. Alert ops on mismatch.

---

## Problem 3 — Multiple Checkout Sessions / double pay (MEDIUM)

A user can create multiple Checkout Sessions for the same PENDING enrollment. Two successful payments with different Stripe IDs can both succeed and inflate `amountPaid`.

**Fix ideas:**

- Expire/cancel previous open Checkout Sessions when creating a new one
- On webhook success, ignore or reverse surplus payments if enrollment already fully paid
- Cap `amountPaid` at net price and auto-refund overage via Stripe

---

## Acceptance criteria

- [x] Manual refund either hits Stripe or is explicitly non-monetary with UI warnings — ledger-only + warnings (2026-07-22)
- [x] Webhook validates amount against enrollment snapshot — flags mismatch (2026-07-22)
- [x] Double successful payment detected + flagged; no double commission (2026-07-22). *Note: overpayment is flagged for manual Stripe refund, not auto-remediated (ledger-only decision).*
- [ ] Tests cover partial refund + already-paid race
