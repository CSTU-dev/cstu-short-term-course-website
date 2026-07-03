import { cn } from "@/lib/utils";

/**
 * CSTU institutional seal — oak tree encircled by the university name.
 * Rendered in `currentColor` so it inherits text color (red on cream,
 * white on red, etc.).
 */
export function CstuSeal({
  className,
  title = "California Science & Technology University",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      fill="currentColor"
    >
      <defs>
        <path id="cstuTArc1" d="M 18,100 A 82,82 0 0,1 182,100" />
        <path id="cstuTArc2" d="M 33,100 A 67,67 0 0,1 167,100" />
        <path id="cstuBArc1" d="M 18,100 A 82,82 0 0,0 182,100" />
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="87" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fontFamily="Georgia, 'Times New Roman', serif" fontSize="14.5" fontWeight="bold" letterSpacing="2.8">
        <textPath href="#cstuTArc1" startOffset="50%" textAnchor="middle">
          CALIFORNIA
        </textPath>
      </text>
      <text fontFamily="Georgia, 'Times New Roman', serif" fontSize="8" letterSpacing="1.2">
        <textPath href="#cstuTArc2" startOffset="50%" textAnchor="middle">
          SCIENCE &amp; TECHNOLOGY
        </textPath>
      </text>
      <ellipse cx="100" cy="74" rx="14" ry="13" />
      <ellipse cx="88" cy="80" rx="12" ry="11" />
      <ellipse cx="112" cy="80" rx="12" ry="11" />
      <ellipse cx="79" cy="73" rx="10" ry="10" />
      <ellipse cx="121" cy="73" rx="10" ry="10" />
      <ellipse cx="91" cy="65" rx="10" ry="9" />
      <ellipse cx="109" cy="66" rx="9" ry="9" />
      <ellipse cx="100" cy="62" rx="9" ry="8" />
      <ellipse cx="83" cy="66" rx="8" ry="8" />
      <ellipse cx="117" cy="67" rx="8" ry="8" />
      <rect x="97.5" y="88" width="5" height="18" rx="1" />
      <line x1="42" y1="108" x2="158" y2="108" stroke="currentColor" strokeWidth="1.2" />
      <line x1="100" y1="106" x2="42" y2="108" stroke="currentColor" strokeWidth="1.1" />
      <line x1="100" y1="106" x2="158" y2="108" stroke="currentColor" strokeWidth="1.1" />
      <line x1="100" y1="106" x2="50" y2="113" stroke="currentColor" strokeWidth="1" />
      <line x1="100" y1="106" x2="150" y2="113" stroke="currentColor" strokeWidth="1" />
      <line x1="100" y1="106" x2="58" y2="117" stroke="currentColor" strokeWidth="0.9" />
      <line x1="100" y1="106" x2="142" y2="117" stroke="currentColor" strokeWidth="0.9" />
      <line x1="100" y1="106" x2="67" y2="120" stroke="currentColor" strokeWidth="0.8" />
      <line x1="100" y1="106" x2="133" y2="120" stroke="currentColor" strokeWidth="0.8" />
      <line x1="100" y1="106" x2="77" y2="122" stroke="currentColor" strokeWidth="0.7" />
      <line x1="100" y1="106" x2="123" y2="122" stroke="currentColor" strokeWidth="0.7" />
      <line x1="100" y1="106" x2="88" y2="123" stroke="currentColor" strokeWidth="0.6" />
      <line x1="100" y1="106" x2="112" y2="123" stroke="currentColor" strokeWidth="0.6" />
      <text fontFamily="Georgia, 'Times New Roman', serif" fontSize="14.5" fontWeight="bold" letterSpacing="2">
        <textPath href="#cstuBArc1" startOffset="50%" textAnchor="middle">
          UNIVERSITY
        </textPath>
      </text>
    </svg>
  );
}
