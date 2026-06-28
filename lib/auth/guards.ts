import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LOGIN_PATH, ROUTE_PREFIX, type RoleValue } from "@/lib/constants";

export async function getSession() {
  return auth();
}

const ENTRY_FOR_ROLE: Record<RoleValue, string> = {
  SUPER_ADMIN: ROUTE_PREFIX.SUPER_ADMIN,
  ADMIN: ROUTE_PREFIX.ADMIN,
  USER: LOGIN_PATH,
};

/**
 * Server-side authorization (the real gate; middleware only handles redirect
 * UX). Call at the top of protected RSC pages and server actions. Redirects to
 * the role's entry point on mismatch and returns the validated session.
 */
export async function requireRole(role: RoleValue) {
  const session = await auth();
  if (!session?.user || session.user.role !== role) {
    redirect(ENTRY_FOR_ROLE[role]);
  }
  return session;
}
