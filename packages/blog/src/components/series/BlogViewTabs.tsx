import { Button } from "@sbozh/react-ui/components/ui/button";

export type BlogView = "posts" | "series";

export interface BlogViewTabsProps {
  value: BlogView;
}

const TABS: { view: BlogView; label: string; href: string }[] = [
  { view: "posts", label: "Posts", href: "/blog" },
  { view: "series", label: "Series", href: "/blog?view=series" },
];

/** Links rather than tabs with state, so each view has its own shareable URL. */
export function BlogViewTabs({ value }: BlogViewTabsProps) {
  return (
    <nav aria-label="Blog view" className="flex items-center gap-2">
      {TABS.map((tab) => (
        <Button
          key={tab.view}
          asChild
          size="sm"
          variant={tab.view === value ? "default" : "outline"}
        >
          <a href={tab.href} aria-current={tab.view === value ? "page" : undefined}>
            {tab.label}
          </a>
        </Button>
      ))}
    </nav>
  );
}
