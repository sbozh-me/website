import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { readFileSync } from "fs";
import { join } from "path";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { readFile } from "fs/promises";
import { projects } from "@/lib/projects/data";
import { ReleasesContent } from "@/components/releases/ReleasesContent";
import { parseChangelogFromContent } from "@/lib/changelog/parser";
import { parseRoadmapFromContent } from "@/lib/roadmap/parser";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import type { TimelineData } from "@sbozh/react-ui/components/ui/vertical-timeline";

interface ReleasesPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

type ReleasesResult =
  | { success: true; releases: ReleaseListItem[]; summaries: Record<string, ReactNode>; hasMore: boolean; currentVersion: string }
  | { success: false; error: string; status?: number };

async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as any);
  return <Content />;
}

const INITIAL_LIMIT = 3;

async function getCurrentVersion(): Promise<string> {
  try {
    // Go up to monorepo root from apps/web
    const packageJsonPath = join(process.cwd(), "..", "..", "package.json");
    const content = await readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);
    return packageJson.version || "0.0.0";
  } catch (error) {
    console.error("Failed to read package.json version:", error);
    return "0.0.0";
  }
}

async function getReleases(projectSlug: string): Promise<ReleasesResult> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      const currentVersion = await getCurrentVersion();
      return { success: true, releases: [], summaries: {}, hasMore: false, currentVersion };
    }

    // Filter releases by project
    const allReleases = await repository.getReleases({
      project: projectSlug,
      limit: INITIAL_LIMIT + 1
    });
    const hasMore = allReleases.length > INITIAL_LIMIT;
    const releases = hasMore ? allReleases.slice(0, INITIAL_LIMIT) : allReleases;

    const summaryEntries = await Promise.all(
      releases.map(async (release) => {
        if (!release.summary) return [release.id, null] as const;
        const content = await compileSummary(release.summary);
        return [release.id, content] as const;
      })
    );
    const summaries = Object.fromEntries(summaryEntries);

    const currentVersion = await getCurrentVersion();
    return { success: true, releases, summaries, hasMore, currentVersion };
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message, status: error.status };
    }
    return { success: false, error: "Unable to load releases" };
  }
}

function getChangelog(): TimelineData | null {
  try {
    // Go up to monorepo root from apps/web
    const changelogPath = join(process.cwd(), "..", "..", "CHANGELOG.md");
    const changelogContent = readFileSync(changelogPath, "utf-8");
    return parseChangelogFromContent(changelogContent);
  } catch (error) {
    console.error("Failed to load changelog:", error);
    return null;
  }
}

function getRoadmap(): { roadmapData: TimelineData; backlogData: TimelineData; completedCount: number; totalCount: number; currentVersion: string } | null {
  try {
    // Go up to monorepo root from apps/web
    const roadmapPath = join(process.cwd(), "..", "..", "ROADMAP.md");
    const backlogPath = join(process.cwd(), "..", "..", "BACKLOGIDEAS.md");
    const packageJsonPath = join(process.cwd(), "..", "..", "package.json");

    const roadmapContent = readFileSync(roadmapPath, "utf-8");
    const backlogContent = readFileSync(backlogPath, "utf-8");
    const packageContent = readFileSync(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageContent);

    const { data: roadmapData, completedCount, totalCount } = parseRoadmapFromContent(roadmapContent);
    const backlogData = parseRoadmapFromContent(backlogContent).data;

    return {
      roadmapData,
      backlogData,
      completedCount,
      totalCount,
      currentVersion: packageJson.version || "0.0.0",
    };
  } catch (error) {
    console.error("Failed to load roadmap:", error);
    return null;
  }
}

export default async function ReleasesPage({ params, searchParams }: ReleasesPageProps) {
  const { slug } = await params;
  const { tab = "notes" } = await searchParams;

  const project = projects.find((p) => p.slug === slug);

  if (!project || slug !== "sbozh-me") {
    notFound();
  }

  // Load all data server-side
  const releaseNotesData = await getReleases(slug);
  const changelogData = getChangelog();
  const roadmapData = getRoadmap();

  return (
    <div className="w-full">
      <ReleasesContent
        projectSlug={slug}
        activeTab={tab}
        releaseNotesData={releaseNotesData}
        changelogData={changelogData}
        roadmapData={roadmapData}
      />
    </div>
  );
}

export async function generateStaticParams() {
  return [{ slug: "sbozh-me" }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: `Releases - ${project.title}`,
    description: `Release notes, changelog, and roadmap for ${project.title}`,
  };
}
