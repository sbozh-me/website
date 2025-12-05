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
    <header className={cn("pmdxjs-header mb-4", className)}>
      <h1 className="text-[28px] font-bold tracking-tight text-[#1a365d]">
        {name}
      </h1>
      {subtitle && (
        <p className="mt-0.5 text-[13px] font-medium text-[#2b6cb0]">
          {subtitle}
        </p>
      )}
      {contact && contact.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-[#4a5568]">
          {contact.map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      )}
    </header>
  );
}
