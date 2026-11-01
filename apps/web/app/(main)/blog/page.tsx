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

// Disable caching - always fetch fresh data from Directus
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts, stories, and ideas from different perspectives.",
  openGraph: {
    title: "Blog | sbozh.me",
    description: "Thoughts, stories, and ideas from different perspectives.",
    type: "website",
    images: ["/ogdefault.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | sbozh.me",
    description: "Thoughts, stories, and ideas from different perspectives.",
    images: ["/ogdefault.png"],
  },
};

interface BlogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  noStore();
  const repository = createBlogRepository();
  const params = await searchParams;

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
    params.view === "timeline"
      ? "timeline"
      : params.view === "series" && seriesWithPosts.length > 0
        ? "series"
        : "cards";

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className={`mx-auto ${activeView === "cards" ? "max-w-6xl" : "max-w-3xl"}`}>
        <h1 className="text-3xl md:text-4xl tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Thoughts, stories, and ideas from different perspectives.
        </p>

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
              <BlogViewTabs value="series" showSeries />
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
            initialFilters={parsePostFilters(params)}
          />
        ) : null}
      </div>
    </div>
  );
}
