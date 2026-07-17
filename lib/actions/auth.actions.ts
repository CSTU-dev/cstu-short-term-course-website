"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { ROLE_HOME } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import {
  clientIp,
  rateLimit,
  RATE_LIMITS,
  retryAfterMessage,
} from "@/lib/rate-limit";
import { consumeUserToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/verification";

const log = createLogger("auth-action");

export type AuthFormState = { error?: string } | undefined;

const RegisterSchema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerUser(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await clientIp();
  const limit = await rateLimit(`signup:ip:${ip}`, RATE_LIMITS.signup);
  if (!limit.ok) {
    return {
      error: `Too many sign-up attempts. Try again in ${retryAfterMessage(limit.retryAfterSec)}.`,
    };
  }

  const parsed = RegisterSchema.safeParse({
    name: (formData.get("name") as string) || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const user = await prisma.user.create({
    data: { email, name, passwordHash: await hashPassword(password), role: "USER" },
  });
  log.info({ userId: user.id }, "user registered");

  // Send the verification link. Users may still sign in, but enrolling/paying/
  // referral earnings stay locked until they verify (see isEmailVerified).
  await sendVerificationEmail(user.id, email);

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: ROLE_HOME.USER,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw error; // redirect signal
  }
  return {};
}

export async function loginWithCredentials(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const explicitRedirect = (formData.get("redirectTo") as string) || null;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const ip = await clientIp();
  const limit = await rateLimit(`login:ip:${ip}`, RATE_LIMITS.login);
  if (!limit.ok) {
    return {
      error: `Too many login attempts. Try again in ${retryAfterMessage(limit.retryAfterSec)}.`,
    };
  }

  try {
    // Don't let signIn redirect: we resolve the destination ourselves below so
    // an admin/superAdmin signing in via /login lands on their dashboard
    // instead of the generic user home.
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  // Credentials verified — resolve the landing page. An explicit deep link
  // (enroll/invite flows) wins; otherwise send the user to their role's home.
  // We read the role from the DB because the session cookie signIn just set
  // isn't yet readable via auth() within this same request.
  let redirectTo = explicitRedirect;
  if (!redirectTo) {
    const account = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    redirectTo = ROLE_HOME[account?.role ?? "USER"];
  }
  redirect(redirectTo);
}

export async function signInWithGoogle(formData: FormData) {
  const redirectTo = (formData.get("redirectTo") as string) || ROLE_HOME.USER;
  await signIn("google", { redirectTo });
}

/**
 * Consume an email-verification token and mark the account verified. Idempotent
 * from the user's view: an already-verified account reports success.
 */
export async function verifyEmail(
  token: string,
): Promise<{ ok: boolean; error?: string }> {
  const userId = await consumeUserToken(token, "EMAIL_VERIFICATION");
  if (!userId) {
    return { ok: false, error: "This verification link is invalid or expired." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });
  log.info({ userId }, "email verified");
  return { ok: true };
}

/**
 * Resend the verification email to the signed-in user. No-ops (reports success)
 * if already verified. TODO: rate-limit per user/IP (security checklist #02).
 */
export async function resendVerification(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { ok: false, error: "Please sign in first." };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });
  if (user?.emailVerified) return { ok: true };

  const limit = await rateLimit(
    `resend-verify:user:${session.user.id}`,
    RATE_LIMITS.resendVerification,
  );
  if (!limit.ok) {
    return {
      ok: false,
      error: `Please wait ${retryAfterMessage(limit.retryAfterSec)} before requesting another email.`,
    };
  }

  await sendVerificationEmail(session.user.id, session.user.email);
  return { ok: true };
}

export async function logout() {
  // Redirect straight to a real page. Going to "/" would hit app/page.tsx's
  // redirect("/home"), and that double redirect breaks the Server Action
  // response behind a reverse proxy (Cloud Run), throwing "An unexpected
  // response was received from the server" on the client.
  await signOut({ redirectTo: "/home" });
}
