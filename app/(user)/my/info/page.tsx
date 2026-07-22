import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { DashboardTabs } from "@/components/user/dashboard-tabs";
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
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      </div>

      <DashboardTabs />

      <div className="max-w-xl space-y-6">
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
    </div>
  );
}
