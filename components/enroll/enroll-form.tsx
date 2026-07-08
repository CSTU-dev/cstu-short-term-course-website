"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEnrollment } from "@/lib/actions/enroll.actions";
import { createCheckoutSession } from "@/lib/actions/payment.actions";
import { REFERRAL_STORAGE_KEY, type CourseModeValue } from "@/lib/constants";

export type EnrollDefaults = {
  name: string;
  phone: string;
  wechat: string;
  email: string;
};

export function EnrollForm({
  courseId,
  mode,
  defaults,
}: {
  courseId: string;
  mode: CourseModeValue;
  defaults: EnrollDefaults;
}) {
  const [form, setForm] = useState({ ...defaults, note: "" });
  const [ref, setRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRef(window.localStorage.getItem(REFERRAL_STORAGE_KEY));
  }, []);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveEnrollment({
        courseId,
        mode,
        snapshotName: form.name,
        snapshotPhone: form.phone,
        snapshotWechat: form.wechat,
        snapshotEmail: form.email,
        note: form.note,
        ref: ref ?? undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Hand off to Stripe's hosted checkout. The enrollment is marked PAID by
      // the webhook once payment succeeds, not here.
      const pay = await createCheckoutSession(res.enrollmentId);
      if (!pay.ok) {
        setError(pay.error);
        return;
      }
      window.location.href = pay.url;
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Review your contact details for this enrollment. Edits here are saved to
        this enrollment only and do not change your profile.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" id="name">
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Email" id="email">
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Phone" id="phone">
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Wechat" id="wechat">
          <Input
            id="wechat"
            value={form.wechat}
            onChange={(e) => set("wechat", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Note (optional)" id="note">
        <Textarea
          id="note"
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          rows={3}
        />
      </Field>
      {ref ? (
        <p className="rounded-md bg-brand/15 px-3 py-2 text-sm text-brand-foreground">
          A referral discount will be applied at checkout.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Redirecting to checkout…" : "Continue to payment"}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        You&apos;ll be redirected to Stripe to complete payment securely.
      </p>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
