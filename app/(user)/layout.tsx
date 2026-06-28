import { PublicHeader } from "@/components/layout/public-header";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
