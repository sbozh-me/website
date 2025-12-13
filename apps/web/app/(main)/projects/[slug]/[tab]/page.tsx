import { notFound } from "next/navigation";
import { getProject, getProjects } from "@/lib/projects/data";

interface TabPageProps {
  params: Promise<{ slug: string; tab: string }>;
}

export async function generateStaticParams() {
  const projects = getProjects();
  const params: { slug: string; tab: string }[] = [];

  for (const project of projects) {
    for (const tab of project.tabs) {
      if (tab.enabled) {
        params.push({
          slug: project.slug,
          tab: tab.id,
        });
      }
    }
  }

  return params;
}

export default async function TabPage({ params }: TabPageProps) {
  const { slug, tab } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const currentTab = project.tabs.find((t) => t.id === tab && t.enabled);

  if (!currentTab) {
    notFound();
  }

  return (
    <div className="prose prose-invert max-w-none">
      <h2>{currentTab.label}</h2>
      <p className="text-muted-foreground">
        Content for {currentTab.label} coming soon...
      </p>
    </div>
  );
}
