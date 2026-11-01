"use client";

import { useEffect, useMemo, useRef } from "react";

import { PostGrid } from "./PostGrid";
import { FilterBar } from "../filters/FilterBar";
import { BlogViewTabs } from "../series/BlogViewTabs";
import { EmptyState } from "../timeline/EmptyState";
import { Timeline } from "../timeline/Timeline";
import { usePostFilters } from "../../hooks/usePostFilters";
import { blogHref, filterPosts, getFilterOptions } from "../../utils/post-filters";
import { getSeriesParts } from "../../utils/series";

import type { PostFilters } from "../../types/filters";
import type { PostListItem } from "../../types/post";
import type { Series } from "../../types/series";

/** Long enough not to rewrite the URL on every keystroke in the search box. */
const URL_UPDATE_DELAY_MS = 300;

export interface BlogBrowserProps {
  /** All published posts, newest first */
  posts: PostListItem[];
  series?: Series[];
  view: "cards" | "timeline";
  initialFilters?: PostFilters;
}

/** The filter bar and its results. Filters live in the URL, so a filtered view can be shared. */
export function BlogBrowser({ posts, series = [], view, initialFilters }: BlogBrowserProps) {
  const { filters, setFilters, clearFilters, hasActiveFilters } = usePostFilters(initialFilters);

  const options = useMemo(() => getFilterOptions(posts, series), [posts, series]);
  // Numbered from the full list: a filtered one would renumber the parts
  const seriesParts = useMemo(() => getSeriesParts(posts, series), [posts, series]);
  const visiblePosts = useMemo(() => filterPosts(posts, filters, series), [posts, filters, series]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    // The URL already matches on load, and may carry parameters that aren't ours
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      window.history.replaceState(window.history.state, "", blogHref(view, filters));
    }, URL_UPDATE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [view, filters]);

  return (
    <>
      <div className="mt-6">
        <BlogViewTabs value={view} filters={filters} showSeries={options.series.length > 0} />
      </div>
      <FilterBar
        className="mt-6"
        options={options}
        filters={filters}
        onFiltersChange={setFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        {visiblePosts.length} {visiblePosts.length === 1 ? "post" : "posts"}
      </p>
      <div className="mt-6">
        {visiblePosts.length === 0 ? (
          <EmptyState message="No posts match these filters" />
        ) : view === "cards" ? (
          <PostGrid posts={visiblePosts} seriesParts={seriesParts} />
        ) : (
          <Timeline posts={visiblePosts} seriesParts={seriesParts} sort={filters.sort} />
        )}
      </div>
    </>
  );
}
