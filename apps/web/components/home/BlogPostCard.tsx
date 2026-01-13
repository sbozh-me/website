import Image from "next/image"
import Link from "next/link"
import type { PostListItem } from "@sbozh/blog/types"

interface BlogPostCardProps {
  post: PostListItem
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-primary"
    >
      {/* Cover Image */}
      {post.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-background">
          <Image
            src={post.image.src}
            alt={post.image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Persona and date */}
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: post.persona.color }}
          />
          <span>{post.persona.name}</span>
          <span>·</span>
          <span>{formatDate(post.date)}</span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {post.excerpt}
        </p>
      </div>
    </Link>
  )
}
