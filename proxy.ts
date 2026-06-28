import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth/config";
import { ROLE } from "@/lib/constants";

const { auth } = NextAuth(authConfig);

/**
 * Domain guards + redirects. The three admin/user areas each have distinct
 * rules (see the plan's redirect table). This is the redirect UX layer only —
 * real authorization is re-checked server-side via requireRole().
 */
export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const role = req.auth?.user?.role;

  const to = (target: string) =>
    NextResponse.redirect(new URL(target, nextUrl));

  // —— superAdmin domain ——
  if (path === "/superAdmin" || path.startsWith("/superAdmin/")) {
    const isRoot = path === "/superAdmin";
    if (role === ROLE.SUPER_ADMIN) {
      return isRoot ? to("/superAdmin/courses") : NextResponse.next();
    }
    // Wrong/no role: root shows the login window, sub-pages bounce to root.
    return isRoot ? NextResponse.next() : to("/superAdmin");
  }

  // —— admin domain ——
  if (path === "/admin" || path.startsWith("/admin/")) {
    const isRoot = path === "/admin";
    if (role === ROLE.ADMIN) {
      return isRoot ? to("/admin/courses") : NextResponse.next();
    }
    return isRoot ? NextResponse.next() : to("/admin");
  }

  // —— my (regular user) domain ——
  if (path === "/my" || path.startsWith("/my/")) {
    if (role === ROLE.USER) {
      return path === "/my" ? to("/my/courses") : NextResponse.next();
    }
    return to("/login");
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/superAdmin/:path*", "/admin/:path*", "/my/:path*"],
};
