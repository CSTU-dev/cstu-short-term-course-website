import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { ProfileForm } from "@/components/user/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export const metadata = { title: "My info" };

export default async function MyInfoPage() {
  const session = await requireRole("USER");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  const defaults = {
    profileName: user?.profileName ?? "",
    profilePhone: user?.profilePhone ?? "",
    profileWechat: user?.profileWechat ?? "",
    preferredEmail: user?.preferredEmail ?? "",
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>My info</CardTitle>
          <CardDescription>
            All fields are optional. Used to pre-fill enrollment forms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm defaults={defaults} />
        </CardContent>
      </Card>

      {user?.passwordHash ? (
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
