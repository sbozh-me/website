import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { readFileSync } from "fs";
import { join } from "path";
import { getProject, getProjects } from "@/lib/projects/data";
import { getSbozhMeTabContent } from "@/lib/projects/content/sbozh-me";
import { getDiscordCommunityTabContent } from "@/lib/projects/content/discord-community";
import { parseChangelogFromContent } from "@/lib/changelog/parser";
import { parseRoadmapFromContent, parseBacklogFromContent } from "@/lib/roadmap/parser";
import { VerticalTimeline } from "@sbozh/react-ui/components/ui/vertical-timeline";
import { RoadmapView } from "@/components/roadmap";
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
  if (slug === "discord-community") {
    return getDiscordCommunityTabContent(tabId);
  }
  return null;
}

function getChangelogData() {
  const changelogPath = join(process.cwd(), "..", "..", "CHANGELOG.md");
  const content = readFileSync(changelogPath, "utf-8");
  return parseChangelogFromContent(content);
}

function getRoadmapData() {
  const roadmapPath = join(process.cwd(), "..", "..", "ROADMAP.md");
  const backlogPath = join(process.cwd(), "..", "..", "BACKLOGIDEAS.md");
  const roadmapContent = readFileSync(roadmapPath, "utf-8");
  const backlogContent = readFileSync(backlogPath, "utf-8");

  const { data: roadmapData, completedCount, totalCount } = parseRoadmapFromContent(roadmapContent);
  const backlogData = parseBacklogFromContent(backlogContent);

  return { roadmapData, backlogData, completedCount, totalCount };
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
        <h2 className="!text-2xl font-semibold mb-6">Changelog</h2>
        <VerticalTimeline data={changelogData} baseGitHubUrl="https://github.com/sbozh-me/website" />
      </div>
    );
  }

  if (slug === "sbozh-me" && tab === "roadmap") {
    const { roadmapData, backlogData, completedCount, totalCount } = getRoadmapData();
    return (
      <div>
        <h2 className="!text-2xl font-semibold mb-6">Roadmap</h2>
        <RoadmapView
          roadmapData={roadmapData}
          backlogData={backlogData}
          completedCount={completedCount}
          totalCount={totalCount}
          currentVersion={project.version}
        />
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
