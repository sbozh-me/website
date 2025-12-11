import { EmptyState, ErrorState, Timeline } from "@sbozh/blog";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";

export default async function BlogPage() {
  const repository = createBlogRepository();

  let posts;
  let error: DirectusError | null = null;

  try {
    posts = await repository.getPosts();
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="tracking-tight">Blog</h1>
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
