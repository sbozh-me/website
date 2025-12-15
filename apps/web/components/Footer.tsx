"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SocialLinks } from "./SocialLinks";
import { getProject } from "@/lib/projects/data";

export function Footer() {
  const pathname = usePathname();
  const sbozhMe = getProject("sbozh-me");

  const linkClass = (href: string) =>
    `text-sm transition-colors ${
      pathname === href
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-8">
          <div className="flex items-center gap-4">
            <Link href="/terms" className={linkClass("/terms")}>
              Terms
            </Link>
            <Link href="/privacy" className={linkClass("/privacy")}>
              Privacy
            </Link>
            <Link href="/contact" className={linkClass("/contact")}>
              Contact
            </Link>
          </div>
          <div className="flex flex-col items-center sm:flex-row gap-4">
            <SocialLinks />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} sbozh.me{sbozhMe?.version && ` v${sbozhMe.version}`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
