"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCourseZoomLink } from "@/lib/actions/course.actions";

export function ZoomLinkEditor({
  courseId,
  zoomLink,
}: {
  courseId: string;
  zoomLink: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(zoomLink ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateCourseZoomLink(courseId, value.trim() || null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="https://zoom.us/j/..."
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Optional. Shared with students once they have paid.
      </p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {saved ? <p className="text-sm text-green-600">Saved.</p> : null}
    </form>
  );
}
