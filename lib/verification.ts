import { sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { createUserToken } from "@/lib/tokens";

/**
 * Issue an email-verification token for a user and email them the link.
 * Returns whether the mail was handed off (see `sendEmail`).
 */
export async function sendVerificationEmail(
  userId: string,
  email: string,
): Promise<boolean> {
  const token = await createUserToken(userId, "EMAIL_VERIFICATION");
  const verifyUrl = `${env.NEXT_PUBLIC_BASE_URL}/verify/${token}`;
  return sendEmail({ to: email, ...verificationEmail(verifyUrl) });
}
