import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
      <p className="text-primary text-5xl font-bold">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/home" className={`${buttonVariants()} mt-6`}>
        Go home
      </Link>
    </div>
  );
}
