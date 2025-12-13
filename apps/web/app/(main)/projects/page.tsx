import type { Metadata } from "next";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { getProjects } from "@/lib/projects/data";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I'm building in public - websites, communities, and tools.",
  openGraph: {
    type: "website",
    title: "Projects | sbozh.me",
    description: "Things I'm building in public - websites, communities, and tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | sbozh.me",
    description: "Things I'm building in public - websites, communities, and tools.",
  },
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="tracking-tight">Projects</h1>
        <p className="mt-6 mb-12 text-muted-foreground">
          Things I&apos;m building in public
        </p>
        <ProjectGrid projects={projects} />
      </div>
    </div>
  );
}
