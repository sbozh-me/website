import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import {
  BlogViewTabs,
  EmptyState,
  ErrorState,
  getSeriesWithPosts,
  SeriesCard,
  Timeline,
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
  searchParams: Promise<{ view?: string | string[] }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  noStore();
  const repository = createBlogRepository();
  const { view } = await searchParams;

  let posts: PostListItem[] | undefined;
  let series: Series[] = [];
  let error: DirectusError | null = null;

  try {
    [posts, series] = await Promise.all([repository.getPosts(), repository.getSeries()]);
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  // Tabs only appear once a series has published posts; until then there's one view
  const seriesWithPosts = posts ? getSeriesWithPosts(posts, series) : [];
  const hasSeries = seriesWithPosts.length > 0;
  const activeView = hasSeries && view === "series" ? "series" : "posts";

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Thoughts, stories, and ideas from different perspectives.
        </p>

        {hasSeries && (
          <div className="mt-6">
            <BlogViewTabs value={activeView} />
          </div>
        )}

        <div className="mt-12">
          {error ? (
            <ErrorState
              title="Unable to load posts"
              message={error.message}
              status={error.status}
            />
          ) : activeView === "series" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {seriesWithPosts.map((item) => (
                <SeriesCard key={item.series.id} {...item} />
              ))}
            </div>
          ) : posts && posts.length === 0 ? (
            <EmptyState />
          ) : posts ? (
            <Timeline posts={posts} series={series} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
