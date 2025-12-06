"use client";

import { cn } from "../../lib/utils";

export interface HeaderProps {
  name: string;
  subtitle?: string;
  contact?: string[];
  className?: string;
}

/**
 * CV Header component - displays name, subtitle, and contact info
 * Styling handled via CSS variables in globals.css
 */
export function Header({ name, subtitle, contact, className }: HeaderProps) {
  return (
    <div className={cn("pmdxjs-header", className)}>
      <h1>{name}</h1>
      {subtitle && <p className="pmdxjs-header-subtitle mt-1">{subtitle}</p>}
      {contact && contact.length > 0 && (
        <div className="pmdxjs-header-contact mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {contact.map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );
}
