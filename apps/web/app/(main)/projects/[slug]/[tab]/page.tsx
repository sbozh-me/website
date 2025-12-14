import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { readFileSync } from "fs";
import { join } from "path";
import { getProject, getProjects } from "@/lib/projects/data";
import { getSbozhMeTabContent } from "@/lib/projects/content/sbozh-me";
import { parseChangelogFromContent } from "@/lib/changelog/parser";
import { VerticalTimeline } from "@/components/timeline";
import { Spark } from "@/components/Spark";
import "@sbozh/blog/styles/prose.css";

const mdxComponents = {
  Spark,
};

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

function getTabContent(slug: string, tabId: string): string | null {
  if (slug === "sbozh-me") {
    return getSbozhMeTabContent(tabId);
  }
  return null;
}

function getChangelogData() {
  const changelogPath = join(process.cwd(), "..", "..", "CHANGELOG.md");
  const content = readFileSync(changelogPath, "utf-8");
  return parseChangelogFromContent(content);
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

  if (slug === "sbozh-me" && tab === "changelog") {
    const changelogData = getChangelogData();
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Changelog</h2>
        <VerticalTimeline data={changelogData} />
      </div>
    );
  }

  const content = getTabContent(slug, tab);

  if (!content) {
    return (
      <div className="prose max-w-none">
        <h2>{currentTab.label}</h2>
        <p className="text-muted-foreground">
          Content for {currentTab.label} coming soon...
        </p>
      </div>
    );
  }

  const { default: MDXContent } = await evaluate(content, {
    ...runtime,
  } as Parameters<typeof evaluate>[1]);

  return (
    <div className="prose max-w-none">
      <MDXContent components={mdxComponents} />
    </div>
  );
}
