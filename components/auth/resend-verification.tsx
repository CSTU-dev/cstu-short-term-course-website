"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { resendVerification } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function ResendVerification() {
  const [pending, startTransition] = useTransition();

  function resend() {
    startTransition(async () => {
      const res = await resendVerification();
      if (!res.ok) {
        toast.error(res.error ?? "Could not send the email.");
        return;
      }
      toast.success("Verification email sent — check your inbox.");
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={resend}
      disabled={pending}
      className="shrink-0"
    >
      {pending ? "Sending…" : "Resend email"}
    </Button>
  );
}
