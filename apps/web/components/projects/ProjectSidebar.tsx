"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@sbozh/react-ui/lib/utils";
import type { ProjectTab } from "@/lib/projects/types";

interface ProjectSidebarProps {
  slug: string;
  tabs: ProjectTab[];
}

function getTabHref(slug: string, tabId: string): string {
  // "about" tab lives at /projects/[slug], others at /projects/[slug]/[tab]
  return tabId === "about" ? `/projects/${slug}` : `/projects/${slug}/${tabId}`;
}

export function ProjectSidebar({ slug, tabs }: ProjectSidebarProps) {
  const pathname = usePathname();
  const enabledTabs = tabs.filter((tab) => tab.enabled);

  return (
    <aside className="hidden lg:block w-[200px] shrink-0 sticky top-24 self-start">
      <nav aria-label="Project navigation" role="navigation">
        <ul className="space-y-1" role="tablist">
          {enabledTabs.map((tab) => {
            const href = getTabHref(slug, tab.id);
            const isActive =
              tab.id === "about"
                ? pathname === `/projects/${slug}`
                : pathname === href;

            return (
              <li key={tab.id} role="presentation">
                <Link
                  href={href}
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "block px-4 py-2 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
