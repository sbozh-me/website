import { Button } from "@sbozh/react-ui/components/ui/button";

import type { Series } from "../../types/series";

export interface SeriesFilterProps {
  series: Series[];
  /** Slug of the selected series; nothing selected means all posts */
  value?: string;
  /** Page the links filter, e.g. `/blog` */
  basePath: string;
}

/**
 * Links rather than a select, so a filtered list has its own shareable URL and
 * works without JavaScript.
 */
export function SeriesFilter({ series, value, basePath }: SeriesFilterProps) {
  if (series.length === 0) {
    return null;
  }

  const links = [
    { key: "all", label: "All posts", href: basePath, active: !value },
    ...series.map((item) => ({
      key: item.id,
      label: item.title,
      href: `${basePath}?series=${encodeURIComponent(item.slug)}`,
      active: item.slug === value,
    })),
  ];

  return (
    <nav aria-label="Filter by series" className="flex flex-wrap items-center gap-2">
      {links.map((link) => (
        <Button
          key={link.key}
          asChild
          size="sm"
          variant={link.active ? "default" : "outline"}
        >
          <a href={link.href} aria-current={link.active ? "page" : undefined}>
            {link.label}
          </a>
        </Button>
      ))}
    </nav>
  );
}
