"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@sbozh/react-ui/components/ui/button";
import { PostCard } from "@sbozh/blog/components";
import { Header } from "@/components/Header";
import type { PostListItem } from "@sbozh/blog/types";

export default function NotFound() {
  const [randomPost, setRandomPost] = useState<PostListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog/random")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setRandomPost(data);
        }
      })
      .catch((err) => console.error("Failed to fetch random post:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <motion.div
          className="max-w-2xl w-full text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Header */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Page Not Found
            </h2>
          </motion.div>

          {/* Quote */}
          <motion.blockquote
            className="text-lg md:text-xl text-muted-foreground italic border-l-4 border-primary pl-6 py-4 my-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            "After all, the wrong road always leads somewhere."
            <br />
            - George Bernard Shaw
          </motion.blockquote>

          {/* Random Blog Post Suggestion */}
          {loading ? (
            <motion.div
              className="mb-8 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-full h-[195.5px] bg-muted border border-border rounded-lg animate-pulse" />
            </motion.div>
          ) : randomPost ? (
            <motion.div
              className="mb-8 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PostCard post={randomPost} />
            </motion.div>
          ) : null}

          {/* Actions */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/">
              <Button variant="ghost" size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Homepage
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}