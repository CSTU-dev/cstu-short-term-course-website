"use client";

import { ShieldOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  assignAdmin,
  demoteAdmin,
  unassignAdmin,
} from "@/lib/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Assigned = { adminId: string; email: string; name: string | null };

export function AdminAssignment({
  courseId,
  admins,
}: {
  courseId: string;
  admins: Assigned[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const res = await assignAdmin(courseId, email);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      setEmail("");
      router.refresh();
    });
  }

  function remove(adminId: string) {
    startTransition(async () => {
      const res = await unassignAdmin(courseId, adminId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Admin removed from this course");
      if (res.noCoursesLeft) {
        toast.info(
          "This admin no longer manages any course. Use “Revoke admin” to remove their admin role.",
        );
      }
      router.refresh();
    });
  }

  function revoke(admin: Assigned) {
    const label = admin.name ? `${admin.name} (${admin.email})` : admin.email;
    if (
      !window.confirm(
        `Revoke admin access for ${label}? This removes the ADMIN role and all course assignments across the whole site, and signs them out of admin sessions.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await demoteAdmin(admin.adminId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Admin role revoked");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {admins.length === 0 ? (
          <li className="text-muted-foreground text-sm">
            No admins assigned yet.
          </li>
        ) : (
          admins.map((admin) => (
            <li
              key={admin.adminId}
              className="bg-card flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-sm">
                {admin.name ? `${admin.name} · ` : ""}
                {admin.email}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(admin.adminId)}
                  disabled={pending}
                  aria-label="Remove from this course"
                  title="Remove from this course"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => revoke(admin)}
                  disabled={pending}
                  aria-label="Revoke admin role (site-wide)"
                  title="Revoke admin role (site-wide)"
                  className="text-destructive hover:text-destructive"
                >
                  <ShieldOff className="size-4" />
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={add} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add admin"}
        </Button>
      </form>
    </div>
  );
}
