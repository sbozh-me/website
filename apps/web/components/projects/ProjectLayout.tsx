import type { ReactNode } from "react";
import { ProjectBreadcrumbs } from "./ProjectBreadcrumbs";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectSidebar } from "./ProjectSidebar";
import { MobileTabScroll } from "./MobileTabScroll";
import type { Project } from "@/lib/projects/types";

interface ProjectLayoutProps {
  project: Project;
  children: ReactNode;
}

export function ProjectLayout({ project, children }: ProjectLayoutProps) {
  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        <ProjectBreadcrumbs project={project} />
        <ProjectHeader project={project} />

        <MobileTabScroll slug={project.slug} tabs={project.tabs} />

        <div className="flex gap-12 mt-8">
          <ProjectSidebar slug={project.slug} tabs={project.tabs} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
