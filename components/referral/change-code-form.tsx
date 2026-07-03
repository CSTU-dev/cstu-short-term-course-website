"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeReferralCode } from "@/lib/actions/referral.actions";

export function ChangeCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await changeReferralCode(code);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCode("");
      toast.success("Referral code updated");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="your-custom-code"
          aria-label="New referral code"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update"}
        </Button>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <p className="text-muted-foreground text-xs">
        Old codes keep working. Up to 3 changes per 24 hours.
      </p>
    </form>
  );
}
