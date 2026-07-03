export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Placeholder — replace with your organization&apos;s terms of service.
      </p>
      <div className="mt-8 space-y-4 text-sm leading-7">
        <p>
          By using this website and enrolling in courses, you agree to these
          terms. This is placeholder copy.
        </p>
        <h2 className="text-lg font-semibold">Use of the service</h2>
        <p>
          Accounts are personal and must not be shared. Course materials are for
          enrolled students only.
        </p>
        <h2 className="text-lg font-semibold">Payments</h2>
        <p>Prices are shown per course. Refunds follow our Refund Policy.</p>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>Email admissions@cstu.edu with any questions.</p>
      </div>
    </article>
  );
}
