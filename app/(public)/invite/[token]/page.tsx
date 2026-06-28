import Link from "next/link";

import { AcceptInvite } from "@/components/auth/accept-invite";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.adminInvite.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  const session = await auth();

  let body: React.ReactNode;
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    body = (
      <p className="text-muted-foreground text-sm">
        This invitation is invalid or has expired.
      </p>
    );
  } else if (!session) {
    const callback = `/invite/${token}`;
    body = (
      <div className="space-y-3 text-sm">
        <p>
          You&apos;ve been invited to become an admin (
          <strong>{invite.email}</strong>). Sign in or create an account with
          that email to accept.
        </p>
        <div className="flex gap-2">
          <Link
            href={`/login?redirectTo=${encodeURIComponent(callback)}`}
            className={buttonVariants()}
          >
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants({ variant: "outline" })}>
            Sign up
          </Link>
        </div>
      </div>
    );
  } else if (
    session.user.email?.toLowerCase() !== invite.email.toLowerCase()
  ) {
    body = (
      <p className="text-destructive text-sm">
        This invitation was sent to {invite.email}, but you&apos;re signed in as{" "}
        {session.user.email}. Please sign in with the invited email.
      </p>
    );
  } else {
    body = <AcceptInvite token={token} />;
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin invitation</CardTitle>
          <CardDescription>Accept to manage assigned courses</CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </div>
  );
}
