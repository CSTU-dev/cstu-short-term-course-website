import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();

/** Optional free-text that, when present, must look like an email address. */
const optionalEmail = (max: number) =>
  optionalText(max).refine(
    (v) => !v || /.+@.+\..+/.test(v),
    "Enter a valid email address",
  );

export const ProfileSchema = z.object({
  profileName: optionalText(120),
  profilePhone: optionalText(40),
  profileWechat: optionalText(80),
  preferredEmail: optionalEmail(200),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

export const EnrollSchema = z.object({
  courseId: z.string().min(1),
  mode: z.enum(["ONLINE", "OFFLINE"]),
  snapshotName: optionalText(120),
  snapshotPhone: optionalText(40),
  snapshotWechat: optionalText(80),
  snapshotEmail: optionalEmail(200),
  note: optionalText(2000),
  ref: optionalText(64),
});

export type EnrollInput = z.infer<typeof EnrollSchema>;
