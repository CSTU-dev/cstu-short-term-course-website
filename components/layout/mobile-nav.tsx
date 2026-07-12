"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logout } from "@/lib/actions/auth.actions";
import { type NavLink } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileNav({
  links,
  showLogout,
}: {
  links: NavLink[];
  showLogout: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "md:hidden",
        )}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-2 flex flex-col gap-1 px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
          {showLogout ? (
            <form action={logout} className="mt-2 px-3">
              <Button type="submit" variant="outline" className="w-full">
                Log out
              </Button>
            </form>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
