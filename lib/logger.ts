import pino from "pino";

/**
 * Structured application logger (Node runtime only — do not import from
 * middleware/edge). Reads process.env directly so it never depends on env
 * validation succeeding. Output is JSON to stdout, collected by the host.
 */
const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level,
  base: { app: "cstu" },
});

/** Create a named child logger, e.g. `createLogger("enroll", { userId })`. */
export function createLogger(
  name: string,
  bindings?: Record<string, unknown>,
) {
  return logger.child({ name, ...bindings });
}
