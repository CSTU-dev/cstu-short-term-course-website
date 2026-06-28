import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/actions/auth.actions";

export function GoogleButton({
  redirectTo,
  enabled,
}: {
  redirectTo?: string;
  enabled: boolean;
}) {
  if (!enabled) return null;

  return (
    <form action={signInWithGoogle}>
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}
      <Button type="submit" variant="outline" className="w-full">
        Continue with Google
      </Button>
    </form>
  );
}
