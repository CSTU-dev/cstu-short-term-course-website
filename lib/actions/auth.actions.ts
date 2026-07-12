"use server";

import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { ROLE_HOME } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";

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

  await prisma.user.create({
    data: { email, name, passwordHash: await hashPassword(password), role: "USER" },
  });
  log.info({ email }, "user registered");

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
  const redirectTo = (formData.get("redirectTo") as string) || ROLE_HOME.USER;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // redirect signal
  }
  return {};
}

export async function signInWithGoogle(formData: FormData) {
  const redirectTo = (formData.get("redirectTo") as string) || ROLE_HOME.USER;
  await signIn("google", { redirectTo });
}

export async function logout() {
  // Redirect straight to a real page. Going to "/" would hit app/page.tsx's
  // redirect("/home"), and that double redirect breaks the Server Action
  // response behind a reverse proxy (Cloud Run), throwing "An unexpected
  // response was received from the server" on the client.
  await signOut({ redirectTo: "/home" });
}
