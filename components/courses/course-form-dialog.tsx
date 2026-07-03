"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { createCourse, updateCourse } from "@/lib/actions/course.actions";

export type CourseFormValues = {
  title: string;
  slug: string;
  startAt: string;
  endAt: string;
  hasOnline: boolean;
  hasOffline: boolean;
  onlinePrice: string;
  offlinePrice: string;
};

const EMPTY: CourseFormValues = {
  title: "",
  slug: "",
  startAt: "",
  endAt: "",
  hasOnline: true,
  hasOffline: false,
  onlinePrice: "",
  offlinePrice: "",
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
    if (!form.hasOnline && !form.hasOffline) {
      setError("Select at least one delivery mode (online or offline).");
      return;
    }
    startTransition(async () => {
      const payload = {
        title: form.title,
        slug: form.slug,
        startAt: form.startAt,
        endAt: form.endAt,
        hasOnline: form.hasOnline,
        hasOffline: form.hasOffline,
        onlinePrice: form.hasOnline ? Number(form.onlinePrice) : null,
        offlinePrice: form.hasOffline ? Number(form.offlinePrice) : null,
      };
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
            <div className="space-y-3">
              <Label>Delivery modes &amp; pricing (USD)</Label>
              <p className="text-muted-foreground text-sm">
                Offer this course online, offline, or both — price each mode
                separately. Select at least one.
              </p>
              <ModeRow
                id="hasOnline"
                label="Online"
                checked={form.hasOnline}
                onCheckedChange={(value) => set("hasOnline", value)}
                price={form.onlinePrice}
                onPriceChange={(value) => set("onlinePrice", value)}
              />
              <ModeRow
                id="hasOffline"
                label="Offline"
                checked={form.hasOffline}
                onCheckedChange={(value) => set("hasOffline", value)}
                price={form.offlinePrice}
                onPriceChange={(value) => set("offlinePrice", value)}
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

function ModeRow({
  id,
  label,
  checked,
  onCheckedChange,
  price,
  onPriceChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  price: string;
  onPriceChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="w-20 shrink-0">
        {label}
      </Label>
      <div className="relative flex-1">
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
          $
        </span>
        <Input
          type="number"
          min="0"
          step="0.01"
          className="pl-6"
          placeholder="0.00"
          value={price}
          disabled={!checked}
          required={checked}
          onChange={(e) => onPriceChange(e.target.value)}
        />
      </div>
    </div>
  );
}
