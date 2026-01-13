import type { ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { readFile } from "fs/promises";
import { join } from "path";
import type { PostListItem } from "@sbozh/blog/types";
import { HomeContent } from "@/components/home";
import { authors } from "@/data/authors";
import { getPostsByAuthors } from "@/actions/blog-posts";
import { ErrorState } from "@sbozh/release-notes/components";
import { ReleaseTimelineWithLoadMore } from "@/components/releases/ReleaseTimelineWithLoadMore";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

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
    const packageJsonPath = join(process.cwd(), "package.json");
    const content = await readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);
    return packageJson.version || "0.0.0";
  } catch (error) {
    console.error("Failed to read package.json version:", error);
    return "0.0.0";
  }
}

async function getReleases(): Promise<ReleasesResult> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      const currentVersion = await getCurrentVersion();
      return { success: true, releases: [], summaries: {}, hasMore: false, currentVersion };
    }

    // Fetch one extra to check if there are more
    const allReleases = await repository.getReleases({ limit: INITIAL_LIMIT + 1 });
    const hasMore = allReleases.length > INITIAL_LIMIT;
    const releases = hasMore ? allReleases.slice(0, INITIAL_LIMIT) : allReleases;

    // Compile MDX summaries in parallel
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

export default async function Home() {
  // Fetch releases and blog posts in parallel
  const defaultAuthor = authors[0];
  const [releasesResult, postsResult] = await Promise.all([
    getReleases(),
    getPostsByAuthors(defaultAuthor.blogAuthorSlugs, 3),
  ]);

  const initialPosts: PostListItem[] = postsResult.success ? postsResult.posts : [];

  return (
    <main className="flex flex-1 flex-col items-center px-6 md:px-12 lg:px-24 self-center">
      <HomeContent authors={authors} initialPosts={initialPosts} />

      {releasesResult.success ? (
        releasesResult.releases.length > 0 && (
          <section className="w-full max-w-3xl py-16">
            <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
              Release Notes
            </h2>
            <ReleaseTimelineWithLoadMore
              initialReleases={releasesResult.releases}
              initialSummaries={releasesResult.summaries}
              initialHasMore={releasesResult.hasMore}
              currentVersion={releasesResult.currentVersion}
            />
          </section>
        )
      ) : (
        <section className="w-full max-w-3xl py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
            Release Notes
          </h2>
          <ErrorState message={releasesResult.error} status={releasesResult.status} />
        </section>
      )}
    </main>
  );
}
