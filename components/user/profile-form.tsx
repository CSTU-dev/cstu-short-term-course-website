"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/user.actions";

export type ProfileDefaults = {
  profileName: string;
  profilePhone: string;
  profileWechat: string;
  preferredEmail: string;
};

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const router = useRouter();
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set(key: keyof ProfileDefaults, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateProfile(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Profile saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" id="profileName">
        <Input
          id="profileName"
          value={form.profileName}
          onChange={(e) => set("profileName", e.target.value)}
        />
      </Field>
      <Field label="Phone" id="profilePhone">
        <Input
          id="profilePhone"
          value={form.profilePhone}
          onChange={(e) => set("profilePhone", e.target.value)}
        />
      </Field>
      <Field label="Wechat" id="profileWechat">
        <Input
          id="profileWechat"
          value={form.profileWechat}
          onChange={(e) => set("profileWechat", e.target.value)}
        />
      </Field>
      <Field label="Preferred email" id="preferredEmail">
        <Input
          id="preferredEmail"
          type="email"
          value={form.preferredEmail}
          onChange={(e) => set("preferredEmail", e.target.value)}
        />
      </Field>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
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
