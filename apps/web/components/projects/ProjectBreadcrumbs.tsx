"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Project } from "@/lib/projects/types";

interface ProjectBreadcrumbsProps {
  project: Project;
}

export function ProjectBreadcrumbs({ project }: ProjectBreadcrumbsProps) {
  const pathname = usePathname();

  // Determine current tab from pathname
  const isAboutPage = pathname === `/projects/${project.slug}`;
  const tabSegment = pathname.split("/").pop();
  const currentTab = isAboutPage
    ? project.tabs.find((t) => t.id === "about")
    : project.tabs.find((t) => t.id === tabSegment);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
      <Link href="/projects" className="hover:text-foreground transition-colors">
        Projects
      </Link>
      <ChevronRight className="size-4" />
      <Link
        href={`/projects/${project.slug}`}
        className="hover:text-foreground transition-colors"
      >
        {project.title}
      </Link>
      {currentTab && (
        <>
          <ChevronRight className="size-4" />
          <span className="text-foreground">{currentTab.label}</span>
        </>
      )}
    </nav>
  );
}
