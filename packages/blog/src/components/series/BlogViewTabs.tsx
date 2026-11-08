import { Button } from "@sbozh/react-ui/components/ui/button";

import { blogHref, type BlogView } from "../../utils/post-filters";

import type { PostFilters } from "../../types/filters";

export interface BlogViewTabsProps {
  value: BlogView;
  /** Carried along when switching view, so a filtered list stays filtered */
  filters?: PostFilters;
  /** The series view only exists once a series has published posts */
  showSeries?: boolean;
  /** Where the "Submit" button at the right of the row points; no button when unset */
  submitHref?: string;
}

const TABS: { view: BlogView; label: string }[] = [
  { view: "cards", label: "Cards" },
  { view: "timeline", label: "Timeline" },
  { view: "series", label: "Series" },
];

/** Links rather than tabs with state, so each view has its own shareable URL. */
export function BlogViewTabs({
  value,
  filters,
  showSeries = false,
  submitHref,
}: BlogViewTabsProps) {
  return (
    <div className="flex items-center gap-2">
      <nav aria-label="Blog view" className="flex items-center gap-2">
        {TABS.filter((tab) => showSeries || tab.view !== "series").map(
          (tab) => (
            <Button
              key={tab.view}
              asChild
              size="sm"
              variant={tab.view === value ? "default" : "outline"}
            >
              <a
                href={blogHref(tab.view, filters)}
                aria-current={tab.view === value ? "page" : undefined}
              >
                {tab.label}
              </a>
            </Button>
          ),
        )}
      </nav>
      {submitHref && (
        <Button asChild size="sm" variant="secondary" className="ml-auto">
          <a href={submitHref}>Submit</a>
        </Button>
      )}
    </div>
  );
}
