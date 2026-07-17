"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordReset,
  type MessageFormState,
} from "@/lib/actions/auth.actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<MessageFormState, FormData>(
    requestPasswordReset,
    undefined,
  );

  if (state?.done) {
    return (
      <p className="text-muted-foreground text-sm">
        If an account exists for that email, we&apos;ve sent a password reset
        link. Check your inbox and spam folder.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      {state?.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
