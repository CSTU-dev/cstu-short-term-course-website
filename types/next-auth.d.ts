import type { DefaultSession } from "next-auth";

import type { RoleValue } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role: RoleValue;
  }

  interface Session {
    user: {
      id: string;
      role: RoleValue;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: RoleValue;
  }
}
