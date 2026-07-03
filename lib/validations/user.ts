import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const ProfileSchema = z.object({
  profileName: optionalText(120),
  profilePhone: optionalText(40),
  profileWechat: optionalText(80),
  preferredEmail: optionalText(200).refine(
    (v) => !v || /.+@.+\..+/.test(v),
    "Enter a valid email address",
  ),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

export const EnrollSchema = z.object({
  courseId: z.string().min(1),
  snapshotName: optionalText(120),
  snapshotPhone: optionalText(40),
  snapshotWechat: optionalText(80),
  snapshotEmail: optionalText(200),
  note: optionalText(2000),
  ref: optionalText(64),
});

export type EnrollInput = z.infer<typeof EnrollSchema>;
