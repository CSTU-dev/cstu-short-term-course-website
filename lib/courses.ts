/**
 * Dependency-free helpers for the dual-mode (online / offline) course pricing
 * model. Safe to import from both server and client components — no Prisma or
 * runtime imports here (Prisma `Decimal` values are accepted via duck typing).
 */
import { COURSE_MODE, type CourseModeValue } from "@/lib/constants";

/** A price as it may arrive: number, decimal string, Prisma Decimal, or absent. */
type PriceInput = number | string | { toString(): string } | null | undefined;

/** The subset of a course needed to reason about modes and prices. */
export type CoursePricing = {
  hasOnline: boolean;
  hasOffline: boolean;
  onlinePrice: PriceInput;
  offlinePrice: PriceInput;
};

const toNum = (v: PriceInput): number | null =>
  v === null || v === undefined ? null : Number(v);

/** Price for a given mode, or null if the course doesn't offer that mode. */
export function modePrice(
  course: CoursePricing,
  mode: CourseModeValue,
): number | null {
  if (mode === COURSE_MODE.ONLINE) {
    return course.hasOnline ? toNum(course.onlinePrice) : null;
  }
  return course.hasOffline ? toNum(course.offlinePrice) : null;
}

/** Modes the course offers, in display order (online first). */
export function availableModes(course: CoursePricing): CourseModeValue[] {
  const modes: CourseModeValue[] = [];
  if (course.hasOnline) modes.push(COURSE_MODE.ONLINE);
  if (course.hasOffline) modes.push(COURSE_MODE.OFFLINE);
  return modes;
}

/** Lowest price across the offered modes, or null if the course has no price. */
export function lowestPrice(course: CoursePricing): number | null {
  const prices = availableModes(course)
    .map((m) => modePrice(course, m))
    .filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/** True when the course offers both delivery modes. */
export function hasBothModes(course: CoursePricing): boolean {
  return course.hasOnline && course.hasOffline;
}

/**
 * Resolve a requested (URL) mode against what the course actually offers.
 * Case-insensitive; falls back to the sole/first offered mode. Null if none.
 */
export function resolveMode(
  course: CoursePricing,
  requested?: string | null,
): CourseModeValue | null {
  const modes = availableModes(course);
  if (modes.length === 0) return null;
  const upper = requested?.toUpperCase();
  if (upper === COURSE_MODE.ONLINE && course.hasOnline) return COURSE_MODE.ONLINE;
  if (upper === COURSE_MODE.OFFLINE && course.hasOffline) {
    return COURSE_MODE.OFFLINE;
  }
  return modes[0];
}

/** The URL query-param form of a mode ("online" / "offline"). */
export function modeParam(mode: CourseModeValue): string {
  return mode.toLowerCase();
}

/**
 * Compact admin/list summary of the offered modes and their prices, e.g.
 * "Online $1,200 · Offline $1,500". USD-only.
 */
export function formatModePricing(course: CoursePricing): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  const parts: string[] = [];
  if (course.hasOnline) {
    const p = toNum(course.onlinePrice);
    parts.push(`Online ${p !== null ? fmt(p) : "—"}`);
  }
  if (course.hasOffline) {
    const p = toNum(course.offlinePrice);
    parts.push(`Offline ${p !== null ? fmt(p) : "—"}`);
  }
  return parts.join(" · ") || "No pricing";
}
