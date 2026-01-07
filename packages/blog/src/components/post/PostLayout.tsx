import type { ReactNode } from "react";
import type { TOCItem } from "../../utils";
import { TableOfContents } from "./TableOfContents";

interface PostLayoutProps {
  children: ReactNode;
  toc?: TOCItem[];
}

/**
 * Grid layout for blog post page with optional table of contents sidebar.
 * Responsive: single column on mobile, two columns (content + TOC) on desktop.
 * Centers content when TOC is hidden.
 */
export function PostLayout({ children, toc }: PostLayoutProps) {
  const hasToc = toc && toc.length > 0;

  return (
    <div
      className={
        hasToc
          ? "grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8 lg:gap-12"
          : "max-w-3xl mx-auto"
      }
    >
      <article className="min-w-0">{children}</article>

      {hasToc && (
        <aside className="hidden lg:block">
          <TableOfContents items={toc} />
        </aside>
      )}
    </div>
  );
}
