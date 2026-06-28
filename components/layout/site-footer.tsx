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
    <footer className="bg-muted/30 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground max-w-xs text-sm">
            California Science and Technology University — professional courses
            and continuing education.
          </p>
        </div>

        <FooterColumn title="Courses" links={courseLinks} />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Contact</h3>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>admissions@cstu.edu</li>
            <li>+1 (000) 000-0000</li>
            <li>1 Education Way, Milpitas, CA</li>
          </ul>
        </div>

        <FooterColumn title="Legal" links={legalLinks} />
      </div>

      <div className="text-muted-foreground border-t py-4 text-center text-xs">
        © {year} CSTU. All rights reserved.
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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-1 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
