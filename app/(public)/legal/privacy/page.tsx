export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Placeholder — replace with your organization&apos;s privacy policy.
      </p>
      <div className="mt-8 space-y-4 text-sm leading-7">
        <p>
          This Privacy Policy describes how CSTU collects, uses, and protects
          your personal information when you use this website.
        </p>
        <h2 className="text-lg font-semibold">Information we collect</h2>
        <p>
          Account details (name, email), enrollment information, and payment
          status. This is placeholder copy.
        </p>
        <h2 className="text-lg font-semibold">How we use information</h2>
        <p>To provide courses, process enrollments, and improve our services.</p>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>Questions? Email admissions@cstu.edu.</p>
      </div>
    </article>
  );
}
