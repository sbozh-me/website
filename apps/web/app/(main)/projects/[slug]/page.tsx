import { redirect, notFound } from "next/navigation";
import { getProject, getProjects } from "@/lib/projects/data";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const firstEnabledTab = project.tabs.find((tab) => tab.enabled);

  if (!firstEnabledTab) {
    notFound();
  }

  redirect(`/projects/${slug}/${firstEnabledTab.id}`);
}
