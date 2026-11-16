import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectLayout } from "@/components/projects/ProjectLayout";
import { getProject, getProjects } from "@/lib/projects/data";
import { getProjectWithVersion } from "@/lib/projects/versions";

interface ProjectLayoutPageProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectLayoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return {};
  }

  return {
    title: project.title,
    description: project.tagline,
    openGraph: {
      type: "website",
      title: `${project.title} | sbozh.me`,
      description: project.tagline,
      images: [`/api/og/projects/${slug}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | sbozh.me`,
      description: project.tagline,
      images: [`/api/og/projects/${slug}`],
    },
  };
}

export default async function Layout({
  params,
  children,
}: ProjectLayoutPageProps) {
  const { slug } = await params;
  // The header shows the version, which Directus sets for sister projects
  const project = await getProjectWithVersion(slug);

  if (!project) {
    notFound();
  }

  return <ProjectLayout project={project}>{children}</ProjectLayout>;
}
