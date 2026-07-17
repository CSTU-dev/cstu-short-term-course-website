/**
 * Transactional email bodies. Kept separate from the transport (`lib/email.ts`)
 * so content and delivery evolve independently. Each builder returns a
 * `{ subject, html }` ready to hand to `sendEmail`.
 */

export interface EmailContent {
  subject: string;
  html: string;
}

/** Shared HTML shell: brand header, content, muted footer. */
function layout(bodyHtml: string): string {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.6">
    <div style="font-size:18px;font-weight:700;padding:16px 0;border-bottom:2px solid #b91c1c;color:#b91c1c">CSTU</div>
    <div style="padding:24px 0">${bodyHtml}</div>
    <div style="padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888">
      This is an automated message from CSTU. If you didn't expect it, you can ignore this email.
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">${label}</a>`;
}

/** Email-address verification link sent on signup / resend. */
export function verificationEmail(verifyUrl: string): EmailContent {
  return {
    subject: "Verify your email for CSTU",
    html: layout(`
      <p>Welcome to CSTU! Please confirm this is your email address to unlock enrolling, payment, and referral earnings.</p>
      <p>${button(verifyUrl, "Verify email")}</p>
      <p style="font-size:13px;color:#666">Or paste this link into your browser:<br><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="font-size:13px;color:#666">This link expires in 24 hours.</p>
    `),
  };
}

/** Admin-invite link for a specific course. */
export function adminInviteEmail(
  courseTitle: string,
  inviteUrl: string,
  ttlDays: number,
): EmailContent {
  return {
    subject: `You've been invited to admin "${courseTitle}" on CSTU`,
    html: layout(`
      <p>You have been invited to be an admin for the course <strong>${courseTitle}</strong> on CSTU.</p>
      <p>Sign in with this email address, then accept the invitation:</p>
      <p>${button(inviteUrl, "Accept invitation")}</p>
      <p style="font-size:13px;color:#666">Or paste this link into your browser:<br><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p style="font-size:13px;color:#666">This invitation expires in ${ttlDays} days.</p>
    `),
  };
}
