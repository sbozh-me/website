"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {type RefObject, useEffect, useRef, useState} from "react";
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
  {name: "Library", href: "/library"},
  {name: "Projects", href: "/projects"},
  {name: "CVs", href: "/cv"},
];

// Sections own their sub-pages
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

// Home: true while the video hero is still under the header (and before it has mounted)
function useOverHero(onHome: boolean, header: RefObject<HTMLElement | null>) {
  const [over, setOver] = useState(true);

  useEffect(() => {
    if (!onHome) return;
    const update = () => {
      const hero = document.querySelector("[data-home-hero]");
      setOver(!hero || hero.getBoundingClientRect().bottom > (header.current?.offsetHeight ?? 0));
    };
    update();
    window.addEventListener("scroll", update, {passive: true});
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [onHome, header]);

  return onHome && over;
}

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const onHome = pathname === "/";
  const overVideo = useOverHero(onHome, headerRef);

  // Client demos under /demo carry their own branding
  if (pathname?.startsWith("/demo/")) {
    return null;
  }

  // Frosted glass pinned to the top: page content blurs behind it. On home it is fixed so
  // the video hero runs under it; elsewhere sticky, so it keeps its place in the flow.
  const position = onHome ? "fixed inset-x-0" : "sticky";
  const glass = overVideo
    ? "border-border/40 bg-background/40 backdrop-blur-md"
    : "border-border/60 bg-background/90 backdrop-blur-lg backdrop-saturate-150 supports-[backdrop-filter]:bg-background/60";

  return (
    <header
      ref={headerRef}
      data-site-header
      data-over-video={overVideo || undefined}
      // Over the video it stays dark whatever the reader's theme (a dark island)
      data-theme-island={overVideo ? "obsidian-forge" : undefined}
      className={`${position} top-0 z-30 border-b transition-[background-color,border-color] duration-300 ${glass}`}
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
            <Link href="/" className="transition-colors hover:text-foreground">
              Personal startup
            </Link>
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
        className={`lg:hidden border-t ${overVideo ? "border-border/40" : "border-border/60"} overflow-hidden transition-[max-height] duration-300 ease-out ${
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
