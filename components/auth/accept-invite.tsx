"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { acceptAdminInvite } from "@/lib/actions/admin.actions";
import { Button } from "@/components/ui/button";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function accept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptAdminInvite(token);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(res.redirectTo);
    });
  }

  return (
    <div className="space-y-3">
      <Button onClick={accept} disabled={pending} className="w-full">
        {pending ? "Accepting…" : "Accept invitation"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
