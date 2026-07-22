import { z } from "zod";

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
    zoomLink: z.url("Enter a valid Zoom link").nullable(),
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
export const ZoomLinkSchema = z.url("Enter a valid Zoom link").nullable();

export const SectionFormSchema = z.object({
  title: z.string().trim().min(1, "Section title is required").max(200),
  videoUrl: z.url("Enter a valid video URL"),
});

export type SectionInput = z.infer<typeof SectionFormSchema>;
