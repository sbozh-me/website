import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { EmptyState, ErrorState, Timeline } from "@sbozh/blog";
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

export default async function BlogPage() {
  noStore();
  const repository = createBlogRepository();

  let posts;
  let error: DirectusError | null = null;

  try {
    posts = await repository.getPosts();
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Thoughts, stories, and ideas from different perspectives.
        </p>

        <div className="mt-12">
          {error ? (
            <ErrorState
              title="Unable to load posts"
              message={error.message}
              status={error.status}
            />
          ) : posts && posts.length === 0 ? (
            <EmptyState />
          ) : posts ? (
            <Timeline posts={posts} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
