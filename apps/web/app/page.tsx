import { readFile } from "fs/promises";
import { join } from "path";
import type { PostListItem } from "@sbozh/blog/types";
import {
  HomeContent,
  HomePoster,
  HomeVideoHero,
  SeriesPromo,
} from "@/components/home";
import { getAvatars, toAuthor } from "@/lib/avatars";
import { getPromotedSeries } from "@/lib/blog/promoted-series";
import { renderSeriesTitles } from "@/lib/blog/title-heading";
import { getProjectWithVersion } from "@/lib/projects/versions";
import { getPostsByAuthors } from "@/actions/blog-posts";
import { ErrorState } from "@sbozh/release-notes/components";
import { ReleaseTimelineWithLoadMore } from "@/components/releases/ReleaseTimelineWithLoadMore";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import {
  createReleaseRepository,
  DirectusError,
} from "@/lib/releases/repository";
import { loadKagurameScript } from "@/lib/kagurame/script";

// Release notes and posts come from Directus at request time. Without this, a build that
// can't see DIRECTUS_* (e.g. from a worktree) prerenders the page with no releases and
// mock posts, and serves that static copy for a year.
export const dynamic = "force-dynamic";

type ReleasesResult =
  | {
      success: true;
      releases: ReleaseListItem[];
      hasMore: boolean;
      currentVersion: string;
    }
  | { success: false; error: string; status?: number };

const INITIAL_LIMIT = 3;

// Announcement poster between the video hero and the promoted series, leading to its post
const POSTER = {
  href: "/library/journal/gta-is-near",
  src: "/images/home/gta-is-near-poster.png",
  alt: "DPSM, post I of III: GTA is near. 17 November 2026. I grant you a holiday. #SEMSDAY, by decree of the 17th Company. Admit all.",
  width: 1280,
  height: 1920,
};

// Project shown under the promoted series in "My current focus"
const FOCUS_PROJECT = "renesans-inter";

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
      return {
        success: true,
        releases: [],
        hasMore: false,
        currentVersion,
      };
    }

    // Fetch one extra to check if there are more
    const allReleases = await repository.getReleases({
      limit: INITIAL_LIMIT + 1,
    });
    const hasMore = allReleases.length > INITIAL_LIMIT;
    const releases = hasMore
      ? allReleases.slice(0, INITIAL_LIMIT)
      : allReleases;

    const currentVersion = await getCurrentVersion();
    return { success: true, releases, hasMore, currentVersion };
  } catch (error) {
    console.error("Failed to fetch releases:", error);
    if (error instanceof DirectusError) {
      return { success: false, error: error.message, status: error.status };
    }
    return { success: false, error: "Unable to load releases" };
  }
}

export default async function Home() {
  // Releases in parallel with avatars, whose first one picks the initial posts
  const [releasesResult, [authors, postsResult], promoted, focusProject] = await Promise.all([
    getReleases(),
    getAvatars().then(async (avatars) => {
      const authors = avatars.map(toAuthor);
      return [
        authors,
        await getPostsByAuthors(authors[0]?.blogAuthorSlugs ?? [], 3),
      ] as const;
    }),
    getPromotedSeries(),
    getProjectWithVersion(FOCUS_PROJECT),
  ]);
  // A promoted series' title may use the glitch syntax: `(;)` is the ✳ logo in its heading
  const promotedHeadings = await renderSeriesTitles(
    Object.values(promoted).map((item) => item.series),
  );

  const initialPosts: PostListItem[] = postsResult.success
    ? postsResult.posts
    : [];

  // Kagurame offers the latest post as the freshest read (not a planned teaser); a
  // broken script hides him
  const latest = initialPosts.find((post) => !post.isPlanned);
  const kagurame = await loadKagurameScript(
    latest && {
      title: latest.title,
      slug: latest.slug,
      type: latest.type,
      readingTime: latest.readingTime,
    },
  );

  return (
    <>
      {/* Full-bleed, outside main's padding; runs under the translucent home header */}
      <HomeVideoHero script={kagurame} />
      <main className="flex flex-1 flex-col items-center px-6 md:px-12 lg:px-24 self-center">
        <HomePoster {...POSTER} />
        <SeriesPromo {...promoted} headings={promotedHeadings} project={focusProject} />
        <HomeContent authors={authors} initialPosts={initialPosts} />

        {releasesResult.success ? (
          releasesResult.releases.length > 0 && (
            <section id="releases" className="w-full max-w-3xl py-16">
              <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
                Release Notes
              </h2>
              <ReleaseTimelineWithLoadMore
                initialReleases={releasesResult.releases}
                initialHasMore={releasesResult.hasMore}
                currentVersion={releasesResult.currentVersion}
              />
            </section>
          )
        ) : (
          <section id="releases" className="w-full max-w-3xl py-16">
            <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
              Release Notes
            </h2>
            <ErrorState
              message={releasesResult.error}
              status={releasesResult.status}
            />
          </section>
        )}
      </main>
    </>
  );
}
