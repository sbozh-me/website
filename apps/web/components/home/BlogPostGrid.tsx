"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import type { PostListItem } from "@sbozh/blog/types"
import { PostCard } from "@sbozh/blog/components"
import { Button } from "@sbozh/react-ui/components/ui/button"

interface BlogPostGridProps {
  posts: PostListItem[]
  title?: string
  isLoading?: boolean
  authorName?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
}

export function BlogPostGrid({
  posts,
  title = "Latest Posts",
  isLoading = false,
  authorName
}: BlogPostGridProps) {
  // Create a key based on post IDs to trigger animation on content change
  const contentKey = posts.map(p => p.id).join("-") || "empty"

  return (
    <section className="w-full py-16 max-w-3xl">
      <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
        {title}
      </h2>

      <div
        className="transition-opacity duration-200"
        style={{ opacity: isLoading ? 0.5 : 1 }}
      >
        <AnimatePresence mode="wait">
          {posts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center py-8"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key={contentKey}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex flex-col">
                {posts.slice(0, 3).map((post) => (
                  <motion.div key={post.id} variants={itemVariants}>
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="mt-8 flex justify-center"
                variants={itemVariants}
              >
                <Button variant="outline" asChild>
                  <Link href="/blog">More posts</Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
