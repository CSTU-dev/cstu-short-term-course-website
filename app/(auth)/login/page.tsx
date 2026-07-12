import Link from "next/link";

import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  // Pass through only an explicit deep-link target. When absent, we let the
  // login action resolve the landing page from the account's role, so an
  // admin/superAdmin signing in here goes to their own dashboard rather than
  // the user home.
  const { redirectTo } = await searchParams;
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your CSTU account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm redirectTo={redirectTo} />
          <GoogleButton redirectTo={redirectTo} enabled={googleEnabled} />
          <p className="text-muted-foreground text-sm">
            No account?{" "}
            <Link href="/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
