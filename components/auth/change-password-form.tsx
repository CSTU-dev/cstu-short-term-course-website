"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePassword,
  type MessageFormState,
} from "@/lib/actions/auth.actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<MessageFormState, FormData>(
    changePassword,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {state?.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state?.done ? (
        <p className="text-sm text-green-700">Your password has been updated.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
