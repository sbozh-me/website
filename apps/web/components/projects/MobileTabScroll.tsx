"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@sbozh/react-ui/lib/utils";
import type { ProjectTab } from "@/lib/projects/types";

interface MobileTabScrollProps {
  slug: string;
  tabs: ProjectTab[];
}

export function MobileTabScroll({ slug, tabs }: MobileTabScrollProps) {
  const pathname = usePathname();
  const enabledTabs = tabs.filter((tab) => tab.enabled);

  return (
    <nav className="lg:hidden overflow-x-auto scrollbar-hide border-b border-border">
      <div className="flex gap-2 px-4 py-3">
        {enabledTabs.map((tab) => {
          const href = `/projects/${slug}/${tab.id}`;
          const isActive = pathname === href;

          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
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
