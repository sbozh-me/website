import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import {
  EmptyState,
  ErrorState,
  SeriesFilter,
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
  searchParams: Promise<{ series?: string | string[] }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  noStore();
  const repository = createBlogRepository();
  const { series: seriesParam } = await searchParams;

  let posts: PostListItem[] | undefined;
  let series: Series[] = [];
  let error: DirectusError | null = null;

  try {
    [posts, series] = await Promise.all([repository.getPosts(), repository.getSeries()]);
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  // A series with nothing published yet would filter down to an empty page
  const filledSeries = series.filter((item) =>
    posts?.some((post) => post.seriesId === item.id)
  );
  const selected = filledSeries.find((item) => item.slug === seriesParam);
  const visiblePosts = selected
    ? posts?.filter((post) => post.seriesId === selected.id)
    : posts;

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Thoughts, stories, and ideas from different perspectives.
        </p>

        <div className="mt-6">
          <SeriesFilter series={filledSeries} value={selected?.slug} basePath="/blog" />
        </div>

        <div className="mt-12">
          {error ? (
            <ErrorState
              title="Unable to load posts"
              message={error.message}
              status={error.status}
            />
          ) : visiblePosts && visiblePosts.length === 0 ? (
            <EmptyState />
          ) : visiblePosts ? (
            <Timeline posts={visiblePosts} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
