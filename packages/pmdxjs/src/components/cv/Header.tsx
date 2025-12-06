"use client";

import { cn } from "../../lib/utils";

export interface HeaderProps {
  name: string;
  subtitle?: string;
  contact?: string[];
  className?: string;
}

/**
 * Detect contact item type and return appropriate link
 */
function renderContactItem(item: string, index: number) {
  const trimmed = item.trim();

  // Phone number (starts with + or contains only digits, spaces, dashes, parens)
  if (/^\+?[\d\s\-()]+$/.test(trimmed)) {
    const phoneNumber = trimmed.replace(/[\s\-()]/g, "");
    return (
      <a key={index} href={`tel:${phoneNumber}`} className="hover:underline">
        {trimmed}
      </a>
    );
  }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return (
      <a key={index} href={`mailto:${trimmed}`} className="hover:underline">
        {trimmed}
      </a>
    );
  }

  // LinkedIn URL or handle
  if (trimmed.includes("linkedin.com") || trimmed.startsWith("linkedin.com")) {
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return (
      <a
        key={index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {trimmed}
      </a>
    );
  }

  // GitHub URL or handle
  if (trimmed.includes("github.com") || trimmed.startsWith("github.com")) {
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    return (
      <a
        key={index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {trimmed}
      </a>
    );
  }

  // Generic URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return (
      <a
        key={index}
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {trimmed}
      </a>
    );
  }

  // Plain text (e.g., location)
  return <span key={index}>{trimmed}</span>;
}

/**
 * CV Header component - displays name, subtitle, and contact info
 * Styling handled via CSS variables in globals.css
 */
export function Header({ name, subtitle, contact, className }: HeaderProps) {
  return (
    <header className={cn("pmdxjs-header", className)}>
      <h1>{name}</h1>
      {subtitle && <p className="pmdxjs-header-subtitle mt-1">{subtitle}</p>}
      {contact && contact.length > 0 && (
        <div className="pmdxjs-header-contact mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {contact.map((item, i) => renderContactItem(item, i))}
        </div>
      )}
    </header>
  );
}
