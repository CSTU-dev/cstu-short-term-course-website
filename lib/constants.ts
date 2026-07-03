/**
 * Shared, dependency-free constants. Safe to import from both server and client
 * components (no Prisma/runtime imports here).
 */

/** Platform roles, mirroring the Prisma `Role` enum. */
export const ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type RoleValue = (typeof ROLE)[keyof typeof ROLE];

/** Course delivery modes, mirroring the Prisma `CourseMode` enum. */
export const COURSE_MODE = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
} as const;

export type CourseModeValue = (typeof COURSE_MODE)[keyof typeof COURSE_MODE];

export const COURSE_MODE_LABELS: Record<CourseModeValue, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

/** Route prefixes that have their own auth domain / redirect rules. */
export const ROUTE_PREFIX = {
  SUPER_ADMIN: "/superAdmin",
  ADMIN: "/admin",
  MY: "/my",
} as const;

/** Where each role lands after a successful login. */
export const ROLE_HOME: Record<RoleValue, string> = {
  SUPER_ADMIN: "/superAdmin/courses",
  ADMIN: "/admin/courses",
  USER: "/my/courses",
};

export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";

// —— Referral / promotion ——
export const REFERRAL_QUERY_PARAM = "ref";
export const REFERRAL_STORAGE_KEY = "cstu_ref";
/** Max referral-code edits allowed within a rolling 24h window. */
export const REFERRAL_MAX_EDITS_PER_DAY = 3;
export const REFERRAL_CODE_LENGTH = 8;

// —— Money ——
export const DEFAULT_CURRENCY = "USD";
/** Placeholder commission rate (10%); made configurable later. */
export const DEFAULT_COMMISSION_RATE = 0.1;
/** Placeholder buyer discount when a valid referral code is applied (10%). */
export const REFERRAL_DISCOUNT_RATE = 0.1;
