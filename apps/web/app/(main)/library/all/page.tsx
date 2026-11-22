import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import {
  BlogBrowser,
  BlogViewTabs,
  EmptyState,
  ErrorState,
  getSeriesWithPosts,
  parsePostFilters,
  SeriesCard,
  type PostListItem,
  type Series,
} from "@sbozh/blog";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";

const TITLE = "All publications";
const TAGLINE = "Every post, newest first.";

/** Anonymous submissions: anyone can send a text, nothing is published without review */
const SUBMIT_HREF = "/library/submit";

export const metadata: Metadata = {
  title: `${TITLE} | Library`,
  description: TAGLINE,
  openGraph: {
    title: `${TITLE} | sbozh.me`,
    description: TAGLINE,
    type: "website",
    images: ["/ogdefault.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | sbozh.me`,
    description: TAGLINE,
    images: ["/ogdefault.png"],
  },
};

interface AllPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LibraryAllPage({ searchParams }: AllPageProps) {
  noStore();
  const repository = createBlogRepository();
  const search = await searchParams;

  let posts: PostListItem[] | undefined;
  let series: Series[] = [];
  let error: DirectusError | null = null;

  try {
    [posts, series] = await Promise.all([repository.getPosts(), repository.getSeries()]);
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  const seriesWithPosts = posts ? getSeriesWithPosts(posts, series) : [];
  const activeView =
    search.view === "timeline"
      ? "timeline"
      : search.view === "series" && seriesWithPosts.length > 0
        ? "series"
        : "cards";

  const basePath = "/library/all";

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className={`mx-auto ${activeView === "cards" ? "max-w-6xl" : "max-w-3xl"}`}>
        <h1 className="text-3xl md:text-4xl tracking-tight">{TITLE}</h1>
        <p className="mt-2 text-muted-foreground">{TAGLINE}</p>

        {error ? (
          <div className="mt-12">
            <ErrorState
              title="Unable to load posts"
              message={error.message}
              status={error.status}
            />
          </div>
        ) : posts && posts.length === 0 ? (
          <div className="mt-12">
            <EmptyState />
          </div>
        ) : activeView === "series" ? (
          <>
            <div className="mt-6">
              <BlogViewTabs
                value="series"
                showSeries
                submitHref={SUBMIT_HREF}
                basePath={basePath}
              />
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {seriesWithPosts.map((item) => (
                <SeriesCard key={item.series.id} {...item} />
              ))}
            </div>
          </>
        ) : posts ? (
          <BlogBrowser
            posts={posts}
            series={series}
            view={activeView}
            initialFilters={parsePostFilters(search)}
            submitHref={SUBMIT_HREF}
            basePath={basePath}
          />
        ) : null}
      </div>
    </div>
  );
}
