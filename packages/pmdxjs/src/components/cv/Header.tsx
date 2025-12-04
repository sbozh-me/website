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
 */
export function Header({ name, subtitle, contact, className }: HeaderProps) {
  return (
    <header className={cn("pmdxjs-header mb-6 text-center", className)}>
      <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
      {subtitle && (
        <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>
      )}
      {contact && contact.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          {contact.map((item, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-2">|</span>}
              {item}
            </span>
          ))}
        </p>
      )}
    </header>
  );
}
