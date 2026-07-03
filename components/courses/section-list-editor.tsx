"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSection,
  deleteSection,
  updateSection,
} from "@/lib/actions/course.actions";

type Section = {
  id: string;
  title: string;
  videoUrl: string;
  position: number;
};

export function SectionListEditor({
  courseId,
  sections,
}: {
  courseId: string;
  sections: Section[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {sections.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sections yet.</p>
        ) : (
          sections.map((section) => (
            <SectionRow key={section.id} courseId={courseId} section={section} />
          ))
        )}
      </div>
      <AddSection courseId={courseId} />
    </div>
  );
}

function SectionRow({
  courseId,
  section,
}: {
  courseId: string;
  section: Section;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(section.title);
  const [videoUrl, setVideoUrl] = useState(section.videoUrl);
  const [pending, startTransition] = useTransition();

  const dirty = title !== section.title || videoUrl !== section.videoUrl;

  function save() {
    startTransition(async () => {
      const res = await updateSection(section.id, { title, videoUrl });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Section saved");
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteSection(section.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Section deleted");
      router.refresh();
    });
  }

  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Video URL</Label>
        <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={save}
          disabled={pending || !dirty}
        >
          Save
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={remove}
          disabled={pending}
          aria-label="Delete section"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function AddSection({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const res = await createSection(courseId, { title, videoUrl });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setTitle("");
      setVideoUrl("");
      toast.success("Section added");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={add}
      className="bg-muted/30 flex flex-col gap-2 rounded-md border border-dashed p-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1">
        <Label className="text-xs">New section title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Week 3 — …"
          required
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label className="text-xs">Video URL</Label>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://…"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
