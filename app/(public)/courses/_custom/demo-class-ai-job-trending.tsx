import { Badge } from "@/components/ui/badge";
import { COURSE_MODE_LABELS } from "@/lib/constants";
import { availableModes } from "@/lib/courses";
import { formatDateTime } from "@/lib/format";

import type { CustomDetailProps } from "./registry";

const hourAgenda = [
  {
    n: "01",
    title: "The 2026 AI job market, in numbers",
    body: "The fastest-growing, best-compensated new engineering role — the Forward Deployed Engineer — is now hired in volume by Palantir, OpenAI, Anthropic, and Google. Learn what the role actually is, why it pays, and why the underlying skill is bigger than the job title.",
  },
  {
    n: "02",
    title: "A live taste of the actual course",
    body: "Not slides about the course — a demo of real course content: how an AI-native builder walks into an ambiguous situation, scopes the real problem, and ships a working fix with agentic tools.",
  },
  {
    n: "03",
    title: "Your questions, answered live",
    body: "Whether the September course fits your background, what the capstone looks like, what it costs, and what you leave with. Ask directly.",
  },
];

const exits = [
  {
    title: "Get hired",
    body: "Build a portfolio and case study positioned for an FDE-style role — the discipline Palantir, OpenAI, Anthropic, and Google now hire for in volume.",
  },
  {
    title: "Found something",
    body: "Use the same embed-listen-ship discipline as a training ground for identifying problems worth building companies around.",
  },
  {
    title: "Transform your current role",
    body: "Bring the discipline into the organization you already work for — especially as a Project, Program, or Product Manager who can now ship prototypes directly.",
  },
];

const courseFacts = [
  ["Starts", "September 5, 2026"],
  ["Format", "6.5 weeks · 13 sessions · 22.5 hours of class time"],
  ["Credit", "1.5 CSTU semester credit hours"],
  ["Instructor", "Professor Ping Wu"],
  [
    "Capstone",
    "A live, deployed solution with a public URL, a self-authored reusable AI Skill, and a portfolio-ready case study",
  ],
];

/**
 * Bespoke detail page for the `demo-class-ai-job-trending` course.
 * The pricing + enroll area is appended automatically by courses/[slug]/page.tsx.
 */
export function DemoClassAiJobTrendingDetail({ course }: CustomDetailProps) {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <span className="absolute inset-x-0 top-0 h-1 bg-ink/40" />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20 lg:py-24">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-transparent bg-cream text-primary">
              Free info class
            </Badge>
            {availableModes(course).map((mode) => (
              <Badge
                key={mode}
                className="border-transparent bg-white text-primary"
              >
                {COURSE_MODE_LABELS[mode]}
              </Badge>
            ))}
          </div>
          <p className="mt-6 font-mono text-xs tracking-[0.08em] text-primary-foreground/70 uppercase">
            Saturday, August 1, 2026 · 12:00–1:00 PM Pacific
          </p>
          <h1 className="font-heading mt-5 max-w-4xl text-4xl font-bold tracking-tight text-cream sm:text-6xl">
            2026 AI Job Trending
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-foreground/85">
            One hour on where the AI job market is actually going — and a live
            demo of the course that trains you for it. No cost, no obligation:
            come see the content, meet the instructor, and decide whether the
            September course is for you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:info@ping-ai.com?subject=RSVP%3A%202026%20AI%20Job%20Trending%20(Aug%201)"
              className="inline-flex justify-center rounded-md bg-cream px-5 py-3 text-sm font-semibold text-primary transition hover:bg-cream/90"
            >
              Reserve your seat — free
            </a>
            <a
              href="#course-preview"
              className="inline-flex justify-center rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-white/10"
            >
              See the September course
            </a>
          </div>
          <p className="mt-5 font-mono text-xs tracking-[0.03em] text-primary-foreground/70">
            Course window: {formatDateTime(course.startAt)} – {formatDateTime(course.endAt)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:py-16">
        {/* The hour */}
        <section>
          <div className="max-w-3xl">
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              The hour
            </p>
            <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What one hour gets you.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {hourAgenda.map((item) => (
              <article key={item.n} className="rounded-md border p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-heading text-lg font-semibold text-primary">
                    {item.title}
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.n}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Course preview */}
        <section id="course-preview" className="space-y-8">
          <div className="max-w-3xl">
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              The course this hour previews
            </p>
            <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              AI for Forward Deploy Engineer, System Architect, and Product Owners
            </h2>
            <p className="mt-4 text-base leading-8 text-muted-foreground">
              A regular CSTU graduate course — CSE 6XX, Forward-Deployed
              Builder: Agentic AI in Practice — starting{" "}
              <strong className="text-foreground">September 5, 2026</strong>.
              Most AI courses teach tool literacy. This one teaches the ability
              to walk into an organization&apos;s actual mess, find the problem
              nobody assigned you, and ship a working solution against its
              mission.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-md border bg-muted/40 p-6">
              <h3 className="font-heading text-xl font-semibold text-primary">
                Course facts
              </h3>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground">
                {courseFacts.map(([label, value]) => (
                  <li key={label}>
                    <strong className="text-foreground">{label}:</strong> {value}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border p-6">
              <h3 className="font-heading text-xl font-semibold text-primary">
                The arc, in one paragraph
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Stand up your local AI build environment and author your first
                Skill, practice deep listening and design thinking on a real
                stakeholder problem, architect and ship a working slice to a live
                public URL, pressure-test it at a midterm demo and package it for
                reuse, run it like a team with Agile, Jira, and a self-built
                Slack Skill, and present the finished capstone as a briefing to
                leadership. Built with Claude Code, Gemini, NotebookLM, OpenAI
                Codex, Google Antigravity, OpenCode, OpenClaw, and Hermes —
                using CSTU&apos;s own multi-cloud platform transformation as the
                live worked example.
              </p>
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section>
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Three exits, one skill
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {exits.map((exit) => (
              <article key={exit.title} className="rounded-md border p-5">
                <h3 className="font-heading text-lg font-semibold text-primary">
                  {exit.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {exit.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Curriculum */}
        {course.sections.length > 0 ? (
          <section>
            <h2 className="font-heading text-2xl font-semibold">
              What you&apos;ll cover in the course
            </h2>
            <ol className="mt-4 space-y-2">
              {(course.sections as Array<{ id: string; title: string }>).map(
                (section: { id: string; title: string }, index: number) => (
                  <li
                    key={section.id}
                    className="flex items-center gap-3 rounded-md border px-4 py-3"
                  >
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium">{section.title}</span>
                  </li>
                ),
              )}
            </ol>
            <p className="mt-2 text-sm text-muted-foreground">
              Full materials unlock after enrollment.
            </p>
          </section>
        ) : null}
      </div>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-16">
          <p className="font-mono text-xs tracking-[0.08em] text-primary-foreground/70 uppercase">
            Saturday, August 1 · 12:00–1:00 PM Pacific · Free
          </p>
          <h2 className="font-heading mt-3 text-3xl font-bold tracking-tight text-cream sm:text-4xl">
            One hour. See the content. Then decide.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-primary-foreground/75">
            The info class is a working demo of real course material — the same
            discipline, compressed into an hour. If it&apos;s not for you, you lost a
            lunch break.
          </p>
          <a
            href="mailto:info@ping-ai.com?subject=RSVP%3A%202026%20AI%20Job%20Trending%20(Aug%201)"
            className="mt-7 inline-flex rounded-md bg-cream px-5 py-3 text-sm font-semibold text-primary transition hover:bg-cream/90"
          >
            Reserve your seat
          </a>
        </div>
      </section>
    </div>
  );
}
