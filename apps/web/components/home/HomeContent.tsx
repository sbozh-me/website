"use client"

import { useState, useCallback, useTransition } from "react"
import type { PostListItem } from "@sbozh/blog/types"
import { AuthorCarousel } from "./AuthorCarousel"
import { BlogPostGrid } from "./BlogPostGrid"
import type { Author } from "@/types/author"
import { getPostsByAuthors } from "@/actions/blog-posts"

interface HomeContentProps {
  authors: Author[]
  initialPosts: PostListItem[]
}

export function HomeContent({ authors, initialPosts }: HomeContentProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [isPending, startTransition] = useTransition()
  const [currentAuthor, setCurrentAuthor] = useState(authors[0])

  const handleAuthorChange = useCallback((author: Author) => {
    setCurrentAuthor(author)

    startTransition(async () => {
      const result = await getPostsByAuthors(author.blogAuthorSlugs, 3)
      if (result.success) {
        setPosts(result.posts)
      }
    })
  }, [])

  return (
    <>
      <div className="group flex min-h-[80vh] flex-col items-center justify-center py-16">
        <AuthorCarousel authors={authors} onAuthorChange={handleAuthorChange} />
      </div>

      <BlogPostGrid
        posts={posts}
        isLoading={isPending}
        authorName={currentAuthor.name}
      />
    </>
  )
}
