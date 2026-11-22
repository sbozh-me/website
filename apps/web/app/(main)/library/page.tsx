import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ErrorState, type PostListItem, type PostType } from "@sbozh/blog";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";
import { LatestPublications } from "./LatestPublications";

// Disable caching - always fetch fresh counts from Directus
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library",
  description: "Laws, stories, articles and journal entries, sorted by shape.",
  openGraph: {
    title: "Library | sbozh.me",
    description: "Laws, stories, articles and journal entries, sorted by shape.",
    type: "website",
    images: ["/ogdefault.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Library | sbozh.me",
    description: "Laws, stories, articles and journal entries, sorted by shape.",
    images: ["/ogdefault.png"],
  },
};

interface Shelf {
  type: PostType;
  label: string;
  tagline: string;
}

const SHELVES: Shelf[] = [
  {
    type: "laws",
    label: "Laws",
    tagline: "The acts and declarations of the Digital Principate.",
  },
  {
    type: "stories",
    label: "Stories",
    tagline: "Stand-up chapters, love stories, rehab narratives.",
  },
  {
    type: "articles",
    label: "Articles",
    tagline: "Essays with a thesis — tech, taste, and takes.",
  },
  {
    type: "journal",
    label: "Journal",
    tagline: "Short status notes, milestones, loose ends.",
  },
  {
    type: "music",
    label: "Music",
    tagline: "TBD.",
  },
];

export default async function LibraryPage() {
  noStore();
  const repository = createBlogRepository();

  let counts: Record<PostType, number> = { laws: 0, stories: 0, articles: 0, journal: 0, music: 0 };
  let posts: PostListItem[] = [];
  let error: DirectusError | null = null;

  try {
    posts = await repository.getPosts();
    for (const post of posts) {
      if (post.type) counts[post.type] += 1;
    }
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl tracking-tight">Library</h1>
          <Button asChild size="sm" variant="secondary" className="shrink-0">
            <Link href="/library/submit">Submit</Link>
          </Button>
        </div>
        <p className="mt-2 text-muted-foreground">
          Pick a shelf.
        </p>

        {error ? (
          <div className="mt-12">
            <ErrorState
              title="Unable to load the library"
              message={error.message}
              status={error.status}
            />
          </div>
        ) : (
          <>
            <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SHELVES.map((shelf) => {
                const count = counts[shelf.type];
                const empty = count === 0;
                return (
                  <li key={shelf.type}>
                    <Link
                      href={`/library/${shelf.type}`}
                      aria-disabled={empty || undefined}
                      className={`group block rounded-lg border border-border/60 p-6 transition-colors ${
                        empty ? "pointer-events-none opacity-50" : "hover:border-primary/60 hover:bg-primary/5"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <h2 className="text-xl md:text-2xl tracking-tight">{shelf.label}</h2>
                        <span className="shrink-0 font-mono text-sm text-muted-foreground tabular-nums">
                          {count} {count === 1 ? "post" : "posts"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{shelf.tagline}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <LatestPublications posts={posts} viewAllHref="/library/all" />
          </>
        )}
      </div>
    </div>
  );
}
