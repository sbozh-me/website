"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@sbozh/react-ui/components/ui/tooltip";

import { HeaderWindowToggle } from "@/lib/blog/glitch/window";
import { ReaderThemeToggle } from "./ReaderTheme";

const navItems = [
  {name: "Home", href: "/"},
  {name: "Blog", href: "/blog"},
  {name: "Forum", href: "/forum"},
  {name: "Projects", href: "/projects"},
];

// Sections own their sub-pages (the Forum holds each avatar's CV)
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Client demos under /demo carry their own branding
  if (pathname?.startsWith("/demo/")) {
    return null;
  }

  // Home: the header floats over the video hero, translucent so the video shows under it
  const overVideo = pathname === "/";

  return (
    <header
      data-over-video={overVideo || undefined}
      // Over the video it stays dark whatever the reader's theme (a dark island)
      data-theme-island={overVideo ? "obsidian-forge" : undefined}
      className={
        overVideo
          ? "absolute inset-x-0 top-0 z-20 border-b border-border/40 bg-background/40 backdrop-blur-md"
          : "relative z-10 border-b border-border bg-background"
      }
    >
      {/* Three columns, the brand centred whatever the sides hold: the menu left (the burger
          on phones), the window and theme switches right */}
      <div className="mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-3 py-4 sm:gap-2 sm:px-6 md:gap-3 md:px-12 lg:px-16 xl:px-24">
        <div className="flex items-center justify-self-start">
          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:bg-primary after:transition-[width] after:duration-200 after:ease-out ${
                  isActive(pathname, item.href)
                    ? "text-primary after:w-full"
                    : "text-muted-foreground hover:text-primary after:w-0 hover:after:w-full"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Hamburger below lg: the four links need more room than a third of a tablet header */}
          <button
            type="button"
            className="lg:hidden flex flex-col justify-center items-center gap-1.5 p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            <span
              className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${
                isOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${
                isOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>

        {/* "Personal startup" takes the width of sbozh.me (w-0 min-w-full) and is sized to fit inside it */}
        <div className="inline-flex flex-col items-center justify-self-center" data-brand>
          <Link href="/" className="text-2xl font-bold leading-none tracking-tight md:text-3xl">
            sbozh.me
          </Link>
          <span className="mt-1 flex w-0 min-w-full justify-center whitespace-nowrap text-[0.625rem] leading-none text-muted-foreground md:text-xs">
            Personal startup
            <TooltipProvider delayDuration={1337}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="-mt-0.5 ml-0.5 inline-block cursor-help">
                    <Image src="/favicon-32x32.png" alt="sbozh.me logo" width={8} height={8} />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Easter egg is under construction</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </div>

        <div className="flex items-center gap-1 justify-self-end md:gap-2">
          <HeaderWindowToggle page={pathname} />
          {/* 44px on phones in any theme (rem is 20px in Roman White), so both fit beside the centred brand */}
          <ReaderThemeToggle className="size-[44px] md:size-11" />
        </div>
      </div>

      {/* Mobile nav menu */}
      <nav
        className={`lg:hidden border-t ${overVideo ? "border-border/40" : "border-border"} overflow-hidden transition-[max-height] duration-300 ease-out ${
          isOpen ? "max-h-64" : "max-h-0"
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`transition-colors ${
                isActive(pathname, item.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
