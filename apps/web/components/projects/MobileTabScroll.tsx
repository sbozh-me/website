"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@sbozh/react-ui/lib/utils";
import type { ProjectTab } from "@/lib/projects/types";

interface MobileTabScrollProps {
  slug: string;
  tabs: ProjectTab[];
}

function getTabHref(slug: string, tabId: string): string {
  // "about" tab lives at /projects/[slug], others at /projects/[slug]/[tab]
  return tabId === "about" ? `/projects/${slug}` : `/projects/${slug}/${tabId}`;
}

export function MobileTabScroll({ slug, tabs }: MobileTabScrollProps) {
  const pathname = usePathname();
  const enabledTabs = tabs.filter((tab) => tab.enabled);

  return (
    <nav
      className="lg:hidden overflow-x-auto scrollbar-hide border-b border-border mt-4"
      aria-label="Project navigation"
      role="navigation"
    >
      <div className="flex gap-2 pb-3" role="tablist">
        {enabledTabs.map((tab) => {
          const href = getTabHref(slug, tab.id);
          const isActive =
            tab.id === "about"
              ? pathname === `/projects/${slug}`
              : pathname === href;

          return (
            <Link
              key={tab.id}
              href={href}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors min-h-[44px] flex items-center",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive
                  ? "border border-primary text-primary bg-primary/10"
                  : "bg-white/5 border border-white/20 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
