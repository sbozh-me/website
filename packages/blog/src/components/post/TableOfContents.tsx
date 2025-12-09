"use client";

import { useEffect, useState } from "react";
import type { TOCItem } from "../../utils";
import "./toc.css";

interface TableOfContentsProps {
  items: TOCItem[];
}

/**
 * Sticky table of contents with active section highlighting.
 * Uses IntersectionObserver to track which heading is currently in view.
 */
export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setTimeout(() => setActiveId(id), 10);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -66%",
        threshold: 1.0,
      }
    );

    // Observe all heading elements
    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [items]);

  return (
    <nav className="toc" aria-label="Table of contents">
      <h2 className="toc-title">On this page</h2>
      <ul className="toc-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`toc-item toc-item-${item.level} ${
              activeId === item.id ? "toc-item-active" : ""
            }`}
          >
            <a
              href={`#${item.id}`}
              className="toc-link"
              onClick={() => handleClick(item.id)}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
