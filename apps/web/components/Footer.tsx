import Link from "next/link";
import { SocialLinks } from "./SocialLinks";
import { getProject } from "@/lib/projects/data";

export function Footer() {
  const sbozhMe = getProject("sbozh-me");

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} sbozh.me{sbozhMe?.version && ` v${sbozhMe.version}`}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <SocialLinks />
          </div>
        </div>
      </div>
    </footer>
  );
}
