import Link from "next/link"
import type { PostListItem } from "@sbozh/blog/types"
import { PostCard } from "@sbozh/blog/components"
import { Button } from "@sbozh/react-ui/components/ui/button"

interface BlogPostGridProps {
  posts: PostListItem[]
  title?: string
  isLoading?: boolean
  authorName?: string
}

export function BlogPostGrid({
  posts,
  title = "Latest Posts",
  isLoading = false,
  authorName
}: BlogPostGridProps) {
  return (
    <section className="w-full py-16 max-w-3xl">
      <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
        {title}
      </h2>

      <div
        className="transition-opacity duration-300"
        style={{ opacity: isLoading ? 0.5 : 1 }}
      >
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {authorName
                ? `No posts from ${authorName} yet.`
                : "No posts available."}
            </p>
            <Link
              href="/blog"
              className="mt-2 inline-block text-primary hover:underline"
            >
              View all posts
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              {posts.slice(0, 3).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/blog">More posts</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
