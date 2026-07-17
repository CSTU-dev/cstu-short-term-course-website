"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { verifyEmail } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function VerifyEmail({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function verify() {
    setError(null);
    startTransition(async () => {
      const res = await verifyEmail(token);
      if (!res.ok) {
        setError(res.error ?? "Verification failed.");
        setState("error");
        return;
      }
      setState("done");
    });
  }

  if (state === "done") {
    return (
      <div className="space-y-3 text-sm">
        <p>Your email is verified. You can now enroll, pay, and earn referrals.</p>
        <Button onClick={() => router.push("/my/courses")} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={verify} disabled={pending} className="w-full">
        {pending ? "Verifying…" : "Verify my email"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
