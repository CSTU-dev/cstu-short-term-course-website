"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { ProfileSchema, type ProfileInput } from "@/lib/validations/user";

import type { ActionResult } from "./course.actions";

export async function updateProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in" };

  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      profileName: d.profileName || null,
      profilePhone: d.profilePhone || null,
      profileWechat: d.profileWechat || null,
      preferredEmail: d.preferredEmail || null,
    },
  });
  await writeAudit({
    action: "USER_PROFILE_UPDATE",
    entityType: "User",
    entityId: session.user.id,
    actorId: session.user.id,
  });
  revalidatePath("/my/info");
  return { ok: true };
}
