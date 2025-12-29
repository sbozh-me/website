"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* 404 Header */}
          <div className="space-y-4">
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Page Not Found
            </h2>
          </div>

          {/* Quote */}
          <blockquote className="text-lg md:text-xl text-muted-foreground italic border-l-4 border-primary pl-6 py-4 my-8">
            "After all, the wrong road always leads somewhere."
            <br />
            - George Bernard Shaw
          </blockquote>

          {/* Random Blog Post Suggestion */}
          {!loading && randomPost && (
            <div className="mb-8 text-left">
              <PostCard post={randomPost} />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <Button variant="default" size="lg" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}