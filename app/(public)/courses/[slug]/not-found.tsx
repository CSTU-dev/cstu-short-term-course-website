import Link from "next/link";

import { RedirectAfter } from "@/components/shared/redirect-after";
import { buttonVariants } from "@/components/ui/button";

export default function CourseNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <RedirectAfter to="/home" seconds={5} />
      <p className="text-primary text-5xl font-bold">404</p>
      <h1 className="mt-4 text-xl font-semibold">Course not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This course doesn&apos;t exist or isn&apos;t available. Redirecting to
        the home page in 5 seconds…
      </p>
      <Link href="/home" className={`${buttonVariants()} mt-6`}>
        Go home now
      </Link>
    </div>
  );
}
