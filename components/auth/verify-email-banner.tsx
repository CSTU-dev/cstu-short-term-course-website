import { ResendVerification } from "@/components/auth/resend-verification";
import { auth } from "@/lib/auth";
import { isEmailVerified } from "@/lib/auth/access";

/**
 * Shown at the top of signed-in user pages when the account's email isn't
 * verified yet. Enrolling, paying, and referrals stay locked until then.
 * Renders nothing for verified users or when signed out.
 */
export async function VerifyEmailBanner() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (await isEmailVerified(session.user.id)) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <p>
          Please verify your email to enroll, pay, and earn referrals. Check
          your inbox for the verification link.
        </p>
        <ResendVerification />
      </div>
    </div>
  );
}
