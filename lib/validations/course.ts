import { z } from "zod";

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
    isOffline: z.boolean(),
    priceAmount: z.coerce
      .number()
      .nonnegative("Price must be zero or more")
      .max(1_000_000),
    currency: z.string().trim().min(1).max(8).default("USD"),
  })
  .refine((d) => d.endAt > d.startAt, {
    message: "End time must be after the start time",
    path: ["endAt"],
  });

export type CourseInput = z.input<typeof CourseFormSchema>;

export const SectionFormSchema = z.object({
  title: z.string().trim().min(1, "Section title is required").max(200),
  videoUrl: z.url("Enter a valid video URL"),
});

export type SectionInput = z.infer<typeof SectionFormSchema>;
