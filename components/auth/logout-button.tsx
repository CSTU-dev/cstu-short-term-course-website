import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth.actions";

export function LogoutButton({
  variant = "ghost",
  className,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  return (
    <form action={logout}>
      <Button type="submit" variant={variant} className={className}>
        Log out
      </Button>
    </form>
  );
}
