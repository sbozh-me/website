import { EmptyState, Timeline } from "@sbozh/blog";
import { createBlogRepository } from "@/lib/blog/repository";

export default async function BlogPage() {
  const repository = createBlogRepository();
  const posts = await repository.getPosts();

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Thoughts, stories, and ideas from different perspectives.
        </p>

        <div className="mt-12">
          {posts.length === 0 ? (
            <EmptyState />
          ) : (
            <Timeline posts={posts} />
          )}
        </div>
      </div>
    </div>
  );
}
