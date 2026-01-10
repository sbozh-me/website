import type { ReactNode } from "react";
import { ProjectBreadcrumbs } from "./ProjectBreadcrumbs";
import { ProjectHeader } from "./ProjectHeader";
import { ProjectSidebar } from "./ProjectSidebar";
import { ProjectLinks } from "./ProjectLinks";
import { MobileTabScroll } from "./MobileTabScroll";
import type { Project } from "@/lib/projects/types";

interface ProjectLayoutProps {
  project: Project;
  children: ReactNode;
  breadcrumbs?: ReactNode;
}

export function ProjectLayout({ project, children, breadcrumbs }: ProjectLayoutProps) {
  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        {breadcrumbs ?? <ProjectBreadcrumbs project={project} />}
        <ProjectHeader project={project} />

        <MobileTabScroll slug={project.slug} tabs={project.tabs} />
        <ProjectLinks project={project} mobile />

        <div className="flex gap-12 mt-8">
          <ProjectSidebar slug={project.slug} tabs={project.tabs} />
          <main className="flex-1 min-w-0">{children}</main>
          <ProjectLinks project={project} />
        </div>
      </div>
    </div>
  );
}
