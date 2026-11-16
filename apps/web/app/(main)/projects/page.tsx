import type { Metadata } from "next";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { getProjectsWithVersions } from "@/lib/projects/versions";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I'm building in public - websites, products, and tools.",
  openGraph: {
    type: "website",
    title: "Projects | sbozh.me",
    description: "Things I'm building in public - websites, products, and tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | sbozh.me",
    description: "Things I'm building in public - websites, products, and tools.",
  },
};

export default async function ProjectsPage() {
  // Sister projects take their version from Directus
  const projects = await getProjectsWithVersions();

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
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
