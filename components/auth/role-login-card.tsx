import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { GoogleButton } from "./google-button";
import { LoginForm } from "./login-form";

/** Embedded login window shown at the /admin and /superAdmin domain roots. */
export function RoleLoginCard({
  title,
  description,
  redirectTo,
}: {
  title: string;
  description: string;
  redirectTo: string;
}) {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm redirectTo={redirectTo} />
          <GoogleButton redirectTo={redirectTo} enabled={googleEnabled} />
        </CardContent>
      </Card>
    </div>
  );
}
