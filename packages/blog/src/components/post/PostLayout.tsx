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
 */
export function PostLayout({ children, toc }: PostLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8 lg:gap-12">
      <article className="min-w-0">{children}</article>

      {toc && toc.length > 0 && (
        <aside className="hidden lg:block">
          <TableOfContents items={toc} />
        </aside>
      )}
    </div>
  );
}
