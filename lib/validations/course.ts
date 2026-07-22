import { z } from "zod";

/**
 * A URL that must use the `https:` scheme (V4). `z.url()` alone accepts
 * `javascript:`, `data:`, etc., which are stored-XSS vectors once rendered into
 * an `href`. `http://localhost` is allowed so local dev can use a plain-HTTP
 * media host.
 */
const httpsUrl = (message: string) =>
  z
    .url(message)
    .refine(
      (u) =>
        /^https:\/\//i.test(u) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(u),
      { message: "Use an https:// URL" },
    );

const priceField = z
  .number()
  .nonnegative("Price must be zero or more")
  .max(1_000_000)
  .nullable();

export const CourseFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    slug: z
      .string()
      .trim()
      .min(1, "Route address is required")
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers and hyphens (e.g. intro-to-ai)",
      ),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    hasOnline: z.boolean(),
    hasOffline: z.boolean(),
    onlinePrice: priceField,
    offlinePrice: priceField,
    zoomLink: httpsUrl("Enter a valid Zoom link").nullable(),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "End time must be after the start time",
    path: ["endAt"],
  })
  .refine((d) => d.hasOnline || d.hasOffline, {
    message: "Select at least one delivery mode (online or offline)",
    path: ["hasOnline"],
  })
  .refine((d) => !d.hasOnline || d.onlinePrice !== null, {
    message: "Enter the online price",
    path: ["onlinePrice"],
  })
  .refine((d) => !d.hasOffline || d.offlinePrice !== null, {
    message: "Enter the offline price",
    path: ["offlinePrice"],
  });

export type CourseInput = z.input<typeof CourseFormSchema>;

/** Standalone Zoom link value (used by the admin's scoped editor). */
export const ZoomLinkSchema = httpsUrl("Enter a valid Zoom link").nullable();

export const SectionFormSchema = z.object({
  title: z.string().trim().min(1, "Section title is required").max(200),
  videoUrl: httpsUrl("Enter a valid video URL"),
});

export type SectionInput = z.infer<typeof SectionFormSchema>;
