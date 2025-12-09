import GithubSlugger from "github-slugger";

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts h2 and h3 headings from markdown content for table of contents generation.
 * Uses the same slugification algorithm as rehype-slug for consistent anchor links.
 *
 * @param markdown - Raw markdown content
 * @returns Array of TOC items with id, text, and level (2 or 3)
 */
export function extractHeadings(markdown: string): TOCItem[] {
  const slugger = new GithubSlugger();
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TOCItem[] = [];

  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugger.slug(text);

    items.push({ id, text, level });
  }

  return items;
}
