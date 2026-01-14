"use client"

import { useState, useCallback, useTransition, useRef, useEffect } from "react"
import type { PostListItem } from "@sbozh/blog/types"
import { AuthorCarousel } from "./AuthorCarousel"
import { BlogPostGrid } from "./BlogPostGrid"
import type { Author } from "@/types/author"
import { getPostsByAuthors } from "@/actions/blog-posts"

const DEBOUNCE_DELAY = 300

interface HomeContentProps {
  authors: Author[]
  initialPosts: PostListItem[]
}

export function HomeContent({ authors, initialPosts }: HomeContentProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [isPending, startTransition] = useTransition()
  const [currentAuthor, setCurrentAuthor] = useState(authors[0])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const postsCache = useRef<Map<string, PostListItem[]>>(
    new Map([[authors[0].id, initialPosts]])
  )

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleAuthorChange = useCallback((author: Author) => {
    setCurrentAuthor(author)

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce all updates (cached or fetched)
    debounceRef.current = setTimeout(() => {
      // Check cache first
      const cachedPosts = postsCache.current.get(author.id)
      if (cachedPosts !== undefined) {
        setPosts(cachedPosts)
        return
      }

      // Fetch if not cached
      startTransition(async () => {
        const result = await getPostsByAuthors(author.blogAuthorSlugs, 3)
        if (result.success) {
          postsCache.current.set(author.id, result.posts)
          setPosts(result.posts)
        }
      })
    }, DEBOUNCE_DELAY)
  }, [])

  return (
    <>
      <div className="group flex min-h-[80vh] flex-col items-center justify-center py-16 max-sm:w-full">
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
