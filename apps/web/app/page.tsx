import { HomeHero } from "@/components/HomeHero";
import { ReleaseTimeline, ErrorState } from "@sbozh/release-notes/components";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";

type ReleasesResult =
  | { success: true; releases: ReleaseListItem[] }
  | { success: false; error: string; status?: number };

async function getReleases(): Promise<ReleasesResult> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return { success: true, releases: [] };
    }
    const releases = await repository.getReleases({ limit: 3 });
    return { success: true, releases };
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
            <ReleaseTimeline releases={result.releases} />
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
