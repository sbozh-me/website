import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import {
  BlogBrowser,
  BlogViewTabs,
  EmptyState,
  ErrorState,
  getSeriesWithPosts,
  parsePostFilters,
  POST_TYPES,
  SeriesCard,
  type PostListItem,
  type PostType,
  type Series,
} from "@sbozh/blog";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";

// Disable caching - always fetch fresh data from Directus
export const dynamic = "force-dynamic";

const LABELS: Record<PostType, string> = {
  laws: "Laws",
  stories: "Stories",
  articles: "Articles",
  journal: "Journal",
};

const TAGLINES: Record<PostType, string> = {
  laws: "The acts and declarations of the Digital Principate.",
  stories: "Stand-up chapters, love stories, rehab narratives.",
  articles: "Essays with a thesis — tech, taste, and takes.",
  journal: "Short status notes, milestones, loose ends.",
};

function isPostType(value: string): value is PostType {
  return (POST_TYPES as readonly string[]).includes(value);
}

/** Anonymous submissions: anyone can send a text, nothing is published without review */
const SUBMIT_HREF = "/library/submit";

interface TypePageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { type } = await params;
  if (!isPostType(type)) {
    return { title: "Library" };
  }
  const label = LABELS[type];
  const tagline = TAGLINES[type];
  return {
    title: `${label} | Library`,
    description: tagline,
    openGraph: {
      title: `${label} | sbozh.me`,
      description: tagline,
      type: "website",
      images: ["/ogdefault.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} | sbozh.me`,
      description: tagline,
      images: ["/ogdefault.png"],
    },
  };
}

export default async function LibraryTypePage({ params, searchParams }: TypePageProps) {
  noStore();
  const { type } = await params;
  if (!isPostType(type)) {
    notFound();
  }

  const repository = createBlogRepository();
  const search = await searchParams;

  let allPosts: PostListItem[] | undefined;
  let series: Series[] = [];
  let error: DirectusError | null = null;

  try {
    [allPosts, series] = await Promise.all([repository.getPosts(), repository.getSeries()]);
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  const posts = allPosts?.filter((post) => post.type === type);
  const seriesWithPosts = posts ? getSeriesWithPosts(posts, series) : [];
  const activeView =
    search.view === "timeline"
      ? "timeline"
      : search.view === "series" && seriesWithPosts.length > 0
        ? "series"
        : "cards";

  const basePath = `/library/${type}`;
  const label = LABELS[type];
  const tagline = TAGLINES[type];

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className={`mx-auto ${activeView === "cards" ? "max-w-6xl" : "max-w-3xl"}`}>
        <h1 className="text-3xl md:text-4xl tracking-tight">{label}</h1>
        <p className="mt-2 text-muted-foreground">{tagline}</p>

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
