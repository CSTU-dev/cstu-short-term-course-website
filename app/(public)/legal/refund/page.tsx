export const metadata = { title: "Refund Policy" };

export default function RefundPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Placeholder — replace with your organization&apos;s refund policy.
      </p>
      <div className="mt-8 space-y-4 text-sm leading-7">
        <p>
          Refunds are reviewed and processed by course administrators on a
          case-by-case basis, based on how much of the course has taken place.
        </p>
        <p>
          As a general guideline (placeholder): a full refund is available
          before the course begins; after it starts, refunds are pro-rated by
          the sessions already held. Contact your course administrator to
          request a refund.
        </p>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p>Email admissions@cstu.edu to start a refund request.</p>
      </div>
    </article>
  );
}
