"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toggleCourseEnabled } from "@/lib/actions/course.actions";

export function EnableToggle({
  courseId,
  enabled,
}: {
  courseId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function onChange(value: boolean) {
    setChecked(value);
    startTransition(async () => {
      const res = await toggleCourseEnabled(courseId, value);
      if (!res.ok) {
        setChecked(!value);
        toast.error(res.error);
        return;
      }
      toast.success(value ? "Course enabled" : "Course disabled");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="course-enabled"
        checked={checked}
        onCheckedChange={onChange}
        disabled={pending}
      />
      <Label htmlFor="course-enabled">{checked ? "Enabled" : "Disabled"}</Label>
    </div>
  );
}
