import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ErrorState, getSeriesWithPosts, PostCard, type SeriesWithPosts } from "@sbozh/blog";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadSeries() {
  const repository = createBlogRepository();
  const [posts, series] = await Promise.all([repository.getPosts(), repository.getSeries()]);
  return getSeriesWithPosts(posts, series);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const current = (await loadSeries()).find((item) => item.series.slug === slug)?.series;
    if (!current) {
      return { title: "Series Not Found" };
    }

    const description = current.description ?? `Posts in the ${current.title} series.`;
    const image = current.image?.src ?? "/og/blog-default.png";

    return {
      title: current.title,
      description,
      openGraph: {
        title: current.title,
        description,
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: current.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: current.title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "Series" };
  }
}

export default async function SeriesPage({ params }: PageProps) {
  noStore();
  const { slug } = await params;

  let all: SeriesWithPosts[];
  try {
    all = await loadSeries();
  } catch (e) {
    const error = DirectusError.fromError(e);
    return (
      <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
        <div className="max-w-3xl mx-auto">
          <ErrorState title="Unable to load series" message={error.message} status={error.status} />
        </div>
      </div>
    );
  }

  const current = all.find((item) => item.series.slug === slug);
  if (!current) {
    notFound();
  }

  const { series, posts } = current;
  const earlier = all.find((item) => item.series.nextSeriesId === series.id)?.series;
  const later = all.find((item) => item.series.id === series.nextSeriesId)?.series;

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <a
          href="/blog?view=series"
          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          ← All series
        </a>

        {series.image && (
          <figure className="mt-6">
            <Image
              src={series.image.src}
              alt={series.image.alt}
              width={series.image.width || 1920}
              height={series.image.height || 1080}
              className="w-full h-auto rounded-lg"
              priority
            />
          </figure>
        )}

        <h1 className="mt-8 text-3xl md:text-4xl font-bold tracking-tight">{series.title}</h1>
        {series.description && (
          <p className="mt-2 text-muted-foreground whitespace-pre-line">{series.description}</p>
        )}

        <ol className="mt-12">
          {posts.map((post, index) => (
            <li key={post.id} className="flex gap-4">
              <span className="w-6 shrink-0 pt-5 text-right text-sm text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <PostCard post={post} />
              </div>
            </li>
          ))}
        </ol>

        {(earlier || later) && (
          <nav aria-label="Linked series" className="mt-8 flex flex-wrap justify-between gap-4 text-sm">
            {earlier && (
              <a href={`/blog/series/${earlier.slug}`} className="text-muted-foreground hover:text-foreground">
                ← Previous series: {earlier.title}
              </a>
            )}
            {later && (
              <a href={`/blog/series/${later.slug}`} className="ml-auto text-muted-foreground hover:text-foreground">
                Next series: {later.title} →
              </a>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
