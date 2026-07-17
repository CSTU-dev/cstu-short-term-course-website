import nodemailer, { type Transporter } from "nodemailer";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

/**
 * Outbound email (Node runtime only — do not import from middleware/edge).
 *
 * Transport is built lazily from `SMTP_URL` (any nodemailer connection URL,
 * e.g. `smtp://user:pass@host:587`). When `SMTP_URL` is unset — the default in
 * local dev — sending is a no-op that logs the message instead, so callers can
 * exercise the full flow without a real mail server.
 */
const log = createLogger("email");

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!env.SMTP_URL) return null;
  if (!transporter) transporter = nodemailer.createTransport(env.SMTP_URL);
  return transporter;
}

const DEFAULT_FROM = env.EMAIL_FROM ?? "CSTU <no-reply@cstu.edu>";

/**
 * Parsed recipient allowlist (lowercased). Empty when `EMAIL_ALLOWLIST` is
 * unset, which disables the guard entirely (production behaviour).
 */
const ALLOWLIST = (env.EMAIL_ALLOWLIST ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

/** True when `to` may receive real mail. No allowlist configured → always true. */
function isAllowedRecipient(to: string): boolean {
  if (ALLOWLIST.length === 0) return true;
  const address = to.toLowerCase();
  const domain = address.slice(address.lastIndexOf("@") + 1);
  return ALLOWLIST.some((entry) => {
    // Full-address entry (has a local part): exact match.
    if (entry.includes("@") && !entry.startsWith("@")) return entry === address;
    // Domain entry, written as "@cstu.edu" or "cstu.edu": match the whole domain.
    return entry.replace(/^@/, "") === domain;
  });
}

export interface SendEmailInput {
  to: string;
  subject: string;
  /** HTML body. A plain-text fallback is derived automatically. */
  html: string;
  /** Optional explicit text body; defaults to a stripped version of `html`. */
  text?: string;
}

/**
 * Send a transactional email. Returns `true` when handed off to the SMTP
 * server (or logged in dev), `false` when the send failed — callers decide
 * whether a failure should surface to the user.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<boolean> {
  const transport = getTransport();
  const plain = text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  if (!transport) {
    // Dev fallback: no SMTP configured. Log enough to follow the link/flow.
    log.warn({ to, subject, text: plain }, "SMTP not configured — email not sent");
    return true;
  }

  if (!isAllowedRecipient(to)) {
    // Staging guard: real SMTP is configured but this recipient is off the
    // allowlist. Drop it rather than emailing a non-tester; log the body so the
    // flow can still be followed from server logs.
    log.warn({ to, subject, text: plain }, "recipient not on EMAIL_ALLOWLIST — email not sent");
    return true;
  }

  try {
    await transport.sendMail({ from: DEFAULT_FROM, to, subject, html, text: plain });
    log.info({ to, subject }, "email sent");
    return true;
  } catch (err) {
    log.error({ err, to, subject }, "email send failed");
    return false;
  }
}
