import type { ReactNode } from "react";
import "@sbozh/themes/obsidian-forge/prose";
import "@sbozh/themes/obsidian-forge/code";

interface ProseProps {
  children: ReactNode;
  className?: string;
}

/**
 * Typography wrapper for article content.
 * Applies prose styling for optimal reading experience.
 */
export function Prose({ children, className = "" }: ProseProps) {
  return <div className={`prose ${className}`}>{children}</div>;
}
