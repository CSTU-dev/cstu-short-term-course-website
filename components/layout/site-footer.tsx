import Link from "next/link";

import { Logo } from "./logo";

const courseLinks = [
  { label: "All courses", href: "/courses" },
  { label: "Home", href: "/home" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Refund policy", href: "/legal/refund" },
  { label: "Terms", href: "/legal/terms" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-800 text-neutral-400 border-t-4 border-primary">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-cream">
            <Logo showWordmark={false} />
            <span className="font-heading text-xl font-bold text-cream">CSTU</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-neutral-500">
            California Science and Technology University — professional courses
            and continuing education.
          </p>
        </div>

        <FooterColumn title="Courses" links={courseLinks} />

        <div className="space-y-4">
          <h3 className="font-mono text-[10px] tracking-[0.12em] text-neutral-400 uppercase">
            Contact
          </h3>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li>
              <a
                href="mailto:admission@cstu.edu"
                className="text-primary transition-opacity hover:opacity-75"
              >
                admission@cstu.edu
              </a>
            </li>
            <li>+1(408) 400 - 3948</li>
            <li>1601 McCarthy Boulevard, Milpitas, CA 95035</li>
          </ul>
        </div>

        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="border-t border-neutral-700">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="font-mono text-[10px] tracking-[0.06em] text-neutral-600 uppercase">
            © {year} California Science &amp; Technology University. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-[10px] tracking-[0.12em] text-neutral-400 uppercase">
        {title}
      </h3>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-neutral-500 transition-colors hover:text-cream"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
