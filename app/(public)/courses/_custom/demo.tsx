import { Badge } from "@/components/ui/badge";
import { COURSE_MODE_LABELS } from "@/lib/constants";
import { availableModes } from "@/lib/courses";
import { formatDateTime } from "@/lib/format";

import type { CustomDetailProps } from "./registry";

/**
 * Bespoke detail page for the `demo` course — a template for building custom,
 * marketing-style course pages. Lay out whatever hero / sections / copy you
 * like; the pricing + enroll area is appended automatically below by the route
 * (see courses/[slug]/page.tsx), so you don't add it here.
 */
export function DemoDetail({ course }: CustomDetailProps) {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <span className="absolute inset-x-0 top-0 h-1 bg-ink/40" />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
          <div className="flex flex-wrap items-center gap-2">
            {availableModes(course).map((mode) => (
              <Badge
                key={mode}
                className="border-transparent bg-white text-primary"
              >
                {COURSE_MODE_LABELS[mode]}
              </Badge>
            ))}
          </div>
          <h1 className="font-heading mt-5 text-4xl font-bold tracking-tight text-cream sm:text-5xl">
            {course.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/85">
            A hands-on program you can take online or in person — learn by
            building, with guidance every step of the way.
          </p>
          <p className="mt-3 font-mono text-xs tracking-[0.03em] text-primary-foreground/70">
            {formatDateTime(course.startAt)} – {formatDateTime(course.endAt)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-12">
        {/* Highlights */}
        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Project-based",
              body: "Ship real work you can show off, not just watch lectures.",
            },
            {
              title: "Live + on-demand",
              body: "Attend in person or online — every session is recorded.",
            },
            {
              title: "Mentor support",
              body: "Get feedback from instructors throughout the course.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-md border p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{f.body}</p>
            </div>
          ))}
        </section>

        {/* Curriculum */}
        {course.sections.length > 0 ? (
          <section>
            <h2 className="text-2xl font-semibold">What you&apos;ll cover</h2>
            <ol className="mt-4 space-y-2">
              {course.sections.map((s, i) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-md border px-4 py-3"
                >
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium">{s.title}</span>
                </li>
              ))}
            </ol>
            <p className="text-muted-foreground mt-2 text-sm">
              Full materials unlock after enrollment.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
