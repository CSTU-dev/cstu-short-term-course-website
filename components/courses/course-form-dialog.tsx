"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createCourse, updateCourse } from "@/lib/actions/course.actions";

export type CourseFormValues = {
  title: string;
  slug: string;
  startAt: string;
  endAt: string;
  isOffline: boolean;
  priceAmount: string;
  currency: string;
};

const EMPTY: CourseFormValues = {
  title: "",
  slug: "",
  startAt: "",
  endAt: "",
  isOffline: false,
  priceAmount: "",
  currency: "USD",
};

export function CourseFormDialog({
  mode,
  courseId,
  initial,
  triggerLabel,
  triggerVariant = "default",
}: {
  mode: "create" | "edit";
  courseId?: string;
  initial?: CourseFormValues;
  triggerLabel: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CourseFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof CourseFormValues>(
    key: K,
    value: CourseFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = { ...form, priceAmount: Number(form.priceAmount) };
      const res =
        mode === "create"
          ? await createCourse(payload)
          : await updateCourse(courseId!, payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (mode === "create") setForm(EMPTY);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant={triggerVariant}
        onClick={() => {
          setForm(initial ?? EMPTY);
          setError(null);
          setOpen(true);
        }}
      >
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add course" : "Edit course"}
            </DialogTitle>
            <DialogDescription>All fields are required.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Title" htmlFor="title">
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </Field>
            <Field label="Route address (slug)" htmlFor="slug">
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="intro-to-ai"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" htmlFor="startAt">
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => set("startAt", e.target.value)}
                  required
                />
              </Field>
              <Field label="End" htmlFor="endAt">
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => set("endAt", e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" htmlFor="priceAmount">
                <Input
                  id="priceAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceAmount}
                  onChange={(e) => set("priceAmount", e.target.value)}
                  required
                />
              </Field>
              <Field label="Currency" htmlFor="currency">
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isOffline"
                checked={form.isOffline}
                onCheckedChange={(value) => set("isOffline", value)}
              />
              <Label htmlFor="isOffline">Offline course</Label>
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
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
