import { PublicHeader } from "@/components/layout/public-header";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <VerifyEmailBanner />
      <main className="flex-1">{children}</main>
    </>
  );
}
