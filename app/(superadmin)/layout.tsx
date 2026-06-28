import { AdminHeader } from "@/components/layout/admin-header";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminHeader />
      <main className="flex-1">{children}</main>
    </>
  );
}
