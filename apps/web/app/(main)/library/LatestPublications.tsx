"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { PostTile, type PostListItem } from "@sbozh/blog";
import { Input } from "@sbozh/react-ui/components/ui/input";

const INITIAL = 5;
const STEP = 5;

export interface LatestPublicationsProps {
  /** All published posts, newest first */
  posts: PostListItem[];
  /** Target for the "View all" link */
  viewAllHref: string;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export function LatestPublications({ posts, viewAllHref }: LatestPublicationsProps) {
  const [visible, setVisible] = useState(INITIAL);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");

  const tags = useMemo<TagOption[]>(() => {
    const byId = new Map<string, TagOption>();
    for (const post of posts) {
      for (const tag of post.tags) {
        const existing = byId.get(tag.id);
        if (existing) {
          existing.count += 1;
        } else {
          byId.set(tag.id, { id: tag.id, name: tag.name, slug: tag.slug, count: 1 });
        }
      }
    }
    return [...byId.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [posts]);

  const matchedTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [tags, tagQuery]);

  const filtered = useMemo(
    () =>
      activeTag
        ? posts.filter((post) => post.tags.some((tag) => tag.id === activeTag))
        : posts,
    [posts, activeTag],
  );

  if (posts.length === 0) return null;

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - visible;
  const hasMore = remaining > 0;

  const handleTag = (tagId: string) => {
    setActiveTag((current) => (current === tagId ? null : tagId));
    setVisible(INITIAL);
  };

  const clearTag = () => {
    setActiveTag(null);
    setVisible(INITIAL);
  };

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setTagsOpen((o) => !o)}
          aria-expanded={tagsOpen}
          aria-controls="latest-publications-tags"
          className="group flex items-center gap-2 rounded-md text-left transition-colors cursor-pointer hover:text-primary"
        >
          <h2 className="text-2xl md:text-3xl tracking-tight">Latest publications</h2>
          <ChevronDownIcon
            className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
              tagsOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          View all →
        </Link>
      </div>

      {tagsOpen && tags.length > 0 && (
        <div id="latest-publications-tags" className="mt-4 space-y-3">
          <Input
            type="search"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            placeholder="Search tags…"
            aria-label="Search tags"
            className="max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearTag}
              aria-pressed={activeTag === null}
              className={`rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer ${
                activeTag === null
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
              }`}
            >
              All
            </button>
            {matchedTags.map((tag) => {
              const active = activeTag === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTag(tag.id)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer ${
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
            {matchedTags.length === 0 && (
              <span className="text-xs text-muted-foreground">No tags match.</span>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((post) => (
          <PostTile key={post.id} post={post} />
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisible((n) => n + STEP)}
            className="group flex h-full min-h-[16rem] flex-col items-center justify-center rounded-lg border border-border bg-muted transition-colors duration-200 cursor-pointer hover:border-primary"
            aria-label={`Load ${Math.min(STEP, remaining)} more`}
          >
            <span className="font-mono text-5xl md:text-6xl font-semibold tabular-nums text-foreground">
              {remaining}
            </span>
            <span className="mt-2 text-sm text-muted-foreground group-hover:text-foreground">
              Left
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
