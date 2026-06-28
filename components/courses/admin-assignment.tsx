"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { assignAdmin, unassignAdmin } from "@/lib/actions/admin.actions";
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
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    setInviteUrl(null);
    startTransition(async () => {
      const res = await assignAdmin(courseId, email);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      setInviteUrl(res.inviteUrl ?? null);
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
      toast.success("Admin removed");
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
              className="bg-card flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <span className="text-sm">
                {admin.name ? `${admin.name} · ` : ""}
                {admin.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(admin.adminId)}
                disabled={pending}
                aria-label="Remove admin"
              >
                <Trash2 className="size-4" />
              </Button>
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

      {inviteUrl ? (
        <div className="bg-muted text-muted-foreground rounded-md p-3 text-xs break-all">
          Invite link (no email configured): {inviteUrl}
        </div>
      ) : null}
    </div>
  );
}
