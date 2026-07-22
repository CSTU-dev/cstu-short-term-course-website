"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordManualRefund } from "@/lib/actions/payment.actions";

export function RefundDialog({
  enrollmentId,
  maxAmount,
  currency,
}: {
  enrollmentId: string;
  maxAmount: number;
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(maxAmount));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await recordManualRefund(enrollmentId, Number(amount), reason);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      toast.success("Ledger adjustment recorded — issue the refund in Stripe");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Record adjustment
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record ledger adjustment</DialogTitle>
          </DialogHeader>
          <div className="border-destructive/30 bg-destructive/5 text-muted-foreground rounded-md border p-3 text-xs">
            This records the refund in our books only — it does{" "}
            <strong>not</strong> return money to the customer. Issue the actual
            refund in the Stripe Dashboard.
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Amount ({currency})</Label>
              <Input
                id="refund-amount"
                type="number"
                min="0"
                step="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Up to {maxAmount.toFixed(2)} {currency} refundable.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Recording…" : "Record adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
