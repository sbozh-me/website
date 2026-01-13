import Link from "next/link"
import type { PostListItem } from "@sbozh/blog/types"
import { Button } from "@sbozh/react-ui/components/ui/button"
import { BlogPostCard } from "./BlogPostCard"

interface BlogPostGridProps {
  posts: PostListItem[]
  title?: string
}

// Placeholder posts for testing/development
export const placeholderPosts: PostListItem[] = [
  {
    id: "1",
    title: "Building a Personal Website in Public",
    slug: "building-personal-website",
    excerpt: "The journey of creating sbozh.me from scratch, including all the decisions, mistakes, and lessons learned along the way.",
    date: "2024-12-15",
    readingTime: 8,
    persona: {
      id: "the-founder",
      name: "The Founder",
      slug: "the-founder",
      color: "#8b5cf6",
    },
    tags: [],
    image: {
      src: "/og/default.png",
      alt: "Building a Personal Website",
    },
  },
  {
    id: "2",
    title: "Why I Started Writing About AI",
    slug: "why-writing-about-ai",
    excerpt: "Exploring the intersection of artificial intelligence and creative writing. How AI is changing the way we think about content.",
    date: "2024-12-10",
    readingTime: 5,
    persona: {
      id: "moris-grloris",
      name: "Moris Grloris",
      slug: "moris-grloris",
      color: "#f59e0b",
    },
    tags: [],
    image: {
      src: "/og/default.png",
      alt: "Writing About AI",
    },
  },
  {
    id: "3",
    title: "The Architecture Behind This Site",
    slug: "architecture-behind-site",
    excerpt: "A deep dive into the technical decisions that power sbozh.me. From Next.js to Directus, here's how it all fits together.",
    date: "2024-12-05",
    readingTime: 12,
    persona: {
      id: "the-architect",
      name: "The Architect",
      slug: "the-architect",
      color: "#22c55e",
    },
    tags: [],
    image: {
      src: "/og/default.png",
      alt: "Site Architecture",
    },
  },
]

export function BlogPostGrid({ posts, title = "Latest Posts" }: BlogPostGridProps) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="w-full py-16">
      <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="flex flex-wrap justify-center gap-6">
        {posts.slice(0, 2).map((post) => (
          <div key={post.id} className="w-full max-w-[720px] sm:w-full">
            <BlogPostCard post={post} />
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/blog">More posts</Link>
        </Button>
      </div>
    </section>
  )
}
