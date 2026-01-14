import type { AnchorHTMLAttributes, ComponentType } from "react";
import { compile } from "@sbozh/pmdxjs";
import { Columns, Column } from "@sbozh/pmdxjs/components";
import {
  Entry,
  Header,
  Section,
  Tags,
  Tag,
  Summary,
  Achievement,
  Languages,
  Divider,
} from "@sbozh/pmdxjs/components/cv";

// Link component that handles external links
function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal =
    props.href &&
    (props.href.startsWith("http://") || props.href.startsWith("https://"));

  if (isExternal) {
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  }
  return <a {...props} />;
}

// PMDX component that compiles raw PMDXJS syntax
// Usage: <PMDX source="## Skills\n\n#tag TypeScript" theme="kognitiv-paper" />
function PMDX({ source, theme }: { source: string; theme?: string }) {
  // Prepend theme config if provided
  const fullSource = theme
    ? `:::config\ntheme: ${theme}\n:::\n\n:::page\n\n${source}\n\n:::page-end`
    : source;

  const { element, error } = compile(fullSource);

  if (error) {
    return (
      <div className="text-destructive text-sm">
        PMDX Error: {error.message}
      </div>
    );
  }

  return <>{element}</>;
}

// All custom components available in blog MDX
export const blogMdxComponents: Record<string, ComponentType<any>> = {
  // Link handling
  a: Link,

  // PMDX - compile raw PMDXJS syntax
  PMDX,

  // PMDXJS CV Components - for resume-style content (JSX approach)
  Entry,
  Header,
  Section,
  Tags,
  Tag,
  Summary,
  Achievement,
  Languages,
  Divider,
  Columns,
  Column,

  // Wrapper for resume-style sections within blog prose
  Resume: ({ children }: { children: React.ReactNode }) => (
    <div className="not-prose my-8 rounded-lg border border-border bg-muted/30 p-6">
      {children}
    </div>
  ),
};
