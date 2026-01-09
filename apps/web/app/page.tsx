import type { ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { HomeHero } from "@/components/HomeHero";
import { ReleaseSection } from "@/components/ReleaseSection";
import { ErrorState } from "@sbozh/release-notes/components";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

type ReleasesResult =
  | { success: true; releases: ReleaseListItem[]; summaries: Record<string, ReactNode>; hasMore: boolean }
  | { success: false; error: string; status?: number };

async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as any);
  return <Content />;
}

async function getReleases(): Promise<ReleasesResult> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return { success: true, releases: [], summaries: {}, hasMore: false };
    }

    // Fetch all releases to check if there are more than 3
    const allReleases = await repository.getReleases({});
    const releases = allReleases.slice(0, 3);
    const hasMore = allReleases.length > 3;

    // Compile MDX summaries in parallel
    const summaryEntries = await Promise.all(
      releases.map(async (release) => {
        if (!release.summary) return [release.id, null] as const;
        const content = await compileSummary(release.summary);
        return [release.id, content] as const;
      })
    );
    const summaries = Object.fromEntries(summaryEntries);

    return { success: true, releases, summaries, hasMore };
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message, status: error.status };
    }
    return { success: false, error: "Unable to load releases" };
  }
}

export default async function Home() {
  const result = await getReleases();

  return (
    <main className="flex flex-1 flex-col items-center px-6 md:px-12 lg:px-24 self-center">
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <HomeHero />
      </div>

      {result.success ? (
        result.releases.length > 0 && (
          <section className="w-full max-w-3xl py-16">
            <h2 className="mb-8 text-2xl font-semibold tracking-tight">
              Recent Updates
            </h2>
            <ReleaseSection
              initialReleases={result.releases}
              initialSummaries={result.summaries}
              initialHasMore={result.hasMore}
            />
          </section>
        )
      ) : (
        <section className="w-full max-w-3xl py-16">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">
            Recent Updates
          </h2>
          <ErrorState message={result.error} status={result.status} />
        </section>
      )}
    </main>
  );
}
