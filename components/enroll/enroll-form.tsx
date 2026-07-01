"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEnrollment } from "@/lib/actions/enroll.actions";

export type EnrollDefaults = {
  name: string;
  phone: string;
  wechat: string;
  email: string;
};

export function EnrollForm({
  courseId,
  defaults,
}: {
  courseId: string;
  defaults: EnrollDefaults;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ ...defaults, note: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveEnrollment({
        courseId,
        snapshotName: form.name,
        snapshotPhone: form.phone,
        snapshotWechat: form.wechat,
        snapshotEmail: form.email,
        note: form.note,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Payment is stubbed until P8 — go straight to the enrolled list.
      router.push("/my/courses");
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
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Continue to payment"}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Payment integration is coming soon. Your enrollment will be saved as
        unpaid.
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
