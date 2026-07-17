import { VerifyEmail } from "@/components/auth/verify-email";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Confirm your email to unlock enrolling, payment, and referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyEmail token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
