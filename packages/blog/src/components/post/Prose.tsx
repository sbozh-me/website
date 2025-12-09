import type { ReactNode } from "react";
import "./prose.css";
import "./code.css";

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
