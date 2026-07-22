"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/auth/access";
import { writeAudit } from "@/lib/audit";
import { REFERRAL_MAX_EDITS_PER_DAY, ROLE } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { isReservedReferralCode, REFERRAL_CODE_REGEX } from "@/lib/referral/code";

import type { ActionResult } from "./course.actions";

/**
 * Change the user's primary referral code. The old code stays valid (a new row
 * is created; the old one is just marked inactive). Limited to 3 changes per
 * rolling 24h window.
 */
export async function changeReferralCode(
  newCode: string,
): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== ROLE.USER) {
    return { ok: false, error: "Not authorized" };
  }
  if (!(await isEmailVerified(session.user.id))) {
    return { ok: false, error: "Please verify your email to manage referrals." };
  }
  const userId = session.user.id;
  const code = newCode.trim();

  if (!REFERRAL_CODE_REGEX.test(code)) {
    return { ok: false, error: "Use 4–32 letters, numbers, - or _." };
  }
  if (isReservedReferralCode(code)) {
    return { ok: false, error: "That code is reserved. Please choose another." };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    await prisma.$transaction(async (tx) => {
      const recent = await tx.referralCodeEdit.count({
        where: { userId, createdAt: { gte: since } },
      });
      if (recent >= REFERRAL_MAX_EDITS_PER_DAY) {
        throw new Error("RATE_LIMIT");
      }

      // Case-insensitive uniqueness so "ABC" and "abc" can't both exist and
      // create confusing/collidable share links (N6).
      const clash = await tx.referralCode.findFirst({
        where: { code: { equals: code, mode: "insensitive" } },
      });
      if (clash) throw new Error("TAKEN");

      await tx.referralCode.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      await tx.referralCode.create({
        data: { userId, code, isActive: true },
      });
      await tx.referralCodeEdit.create({ data: { userId, newCode: code } });
      await writeAudit({
        action: "REFERRAL_CODE_CREATE",
        entityType: "ReferralCode",
        after: { code },
        actorId: userId,
        client: tx,
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "RATE_LIMIT") {
      return {
        ok: false,
        error: "You can only change your code 3 times per 24 hours.",
      };
    }
    if (message === "TAKEN") {
      return { ok: false, error: "That code is already taken." };
    }
    throw error;
  }

  revalidatePath("/my/referrals");
  return { ok: true };
}
