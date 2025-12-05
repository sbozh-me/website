"use client";

import { useEffect, useState } from "react";

export interface OverflowElement {
  name: string;
  type: string;
  overflowPx: number;
  suggestion: string;
}

export interface PageOverflowResult {
  fits: boolean;
  totalOverflowPx: number;
  elements: OverflowElement[];
  message: string;
}

/**
 * Get a human-readable name for an element based on its content
 */
function getElementName(el: Element): string {
  // Check for section title
  const sectionTitle = el.querySelector("h2, h3");
  if (sectionTitle?.textContent) {
    return `"${sectionTitle.textContent.trim()}" section`;
  }

  // Check for entry (job/education)
  const entryRole = el.querySelector(".pmdxjs-entry-role");
  const entryCompany = el.querySelector(".pmdxjs-entry-company");
  if (entryRole?.textContent || entryCompany?.textContent) {
    const role = entryRole?.textContent?.trim() || "Entry";
    const company = entryCompany?.textContent?.trim();
    return company ? `"${role}" at ${company}` : `"${role}" entry`;
  }

  // Check for header
  const headerName = el.querySelector("h1");
  if (headerName?.textContent) {
    return "Header";
  }

  // Check for tags
  if (el.classList.contains("pmdxjs-tags")) {
    const tagCount = el.querySelectorAll(".pmdxjs-tag").length;
    return `Skills tags (${tagCount} items)`;
  }

  // Check for list
  if (el.tagName === "UL" || el.tagName === "OL") {
    const itemCount = el.querySelectorAll("li").length;
    return `List (${itemCount} items)`;
  }

  // Check for paragraph
  if (el.tagName === "P") {
    const text = el.textContent?.trim() || "";
    const preview = text.length > 30 ? text.substring(0, 30) + "..." : text;
    return `Paragraph: "${preview}"`;
  }

  // Fallback to class name or tag
  const className = el.className
    .split(" ")
    .find((c) => c.startsWith("pmdxjs-"));
  if (className) {
    return className.replace("pmdxjs-", "").replace(/-/g, " ");
  }

  return el.tagName.toLowerCase();
}

/**
 * Get element type for categorization
 */
function getElementType(el: Element): string {
  if (el.classList.contains("pmdxjs-section")) return "section";
  if (el.classList.contains("pmdxjs-entry")) return "entry";
  if (el.classList.contains("pmdxjs-header")) return "header";
  if (el.classList.contains("pmdxjs-tags")) return "tags";
  if (el.classList.contains("pmdxjs-columns")) return "columns";
  if (el.classList.contains("pmdxjs-column")) return "column";
  if (el.tagName === "UL" || el.tagName === "OL") return "list";
  if (el.tagName === "P") return "paragraph";
  return "element";
}

/**
 * Generate a helpful suggestion based on element type and overflow amount
 */
function getSuggestion(type: string, overflowPx: number): string {
  const lines = Math.ceil(overflowPx / 14); // Approximate lines at ~14px line height

  switch (type) {
    case "section":
      return `Consider removing ${lines} line${lines > 1 ? "s" : ""} or moving this section to a second page`;
    case "entry":
      return `Shorten the description by ~${lines} line${lines > 1 ? "s" : ""} or reduce bullet points`;
    case "tags":
      return `Remove ${Math.ceil(overflowPx / 24)} skill tag${Math.ceil(overflowPx / 24) > 1 ? "s" : ""} to fit`;
    case "list":
      return `Remove ${lines} list item${lines > 1 ? "s" : ""} or shorten existing items`;
    case "paragraph":
      return `Shorten this paragraph by approximately ${Math.ceil(overflowPx / 14) * 10} characters`;
    case "header":
      return "Consider a shorter subtitle or removing contact details";
    default:
      return `Reduce content by approximately ${overflowPx}px`;
  }
}

/**
 * Hook to detect and report page overflow with human-readable messages
 */
export function usePageOverflow(
  containerRef: React.RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): PageOverflowResult {
  const [result, setResult] = useState<PageOverflowResult>({
    fits: true,
    totalOverflowPx: 0,
    elements: [],
    message: "",
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const page = containerRef.current.querySelector(".pmdxjs-page");
    if (!page) return;

    const pageRect = page.getBoundingClientRect();
    const pageBottom = pageRect.bottom;

    const overflowingElements: OverflowElement[] = [];

    // Check all major content elements
    const selectors = [
      ".pmdxjs-header",
      ".pmdxjs-section",
      ".pmdxjs-entry",
      ".pmdxjs-tags",
      ".pmdxjs-paragraph",
      ".pmdxjs-list",
      ".pmdxjs-divider",
    ];

    selectors.forEach((selector) => {
      page.querySelectorAll(selector).forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > pageBottom) {
          const overflowPx = Math.round(rect.bottom - pageBottom);
          const type = getElementType(el);
          overflowingElements.push({
            name: getElementName(el),
            type,
            overflowPx,
            suggestion: getSuggestion(type, overflowPx),
          });
        }
      });
    });

    // Remove duplicates (child elements of already reported parents)
    const uniqueElements = overflowingElements.filter((el, index) => {
      // Keep if this is the first occurrence or has different name
      return (
        overflowingElements.findIndex((e) => e.name === el.name) === index
      );
    });

    // Sort by overflow amount (most overflow first)
    uniqueElements.sort((a, b) => b.overflowPx - a.overflowPx);

    const totalOverflow =
      uniqueElements.length > 0
        ? Math.max(...uniqueElements.map((e) => e.overflowPx))
        : 0;

    // Generate human-readable message
    let message = "";
    if (uniqueElements.length === 0) {
      message = "All content fits within the page.";
    } else if (uniqueElements.length === 1) {
      const el = uniqueElements[0];
      message = `${el.name} overflows by ${el.overflowPx}px. ${el.suggestion}.`;
    } else {
      message = `${uniqueElements.length} elements overflow the page:\n`;
      uniqueElements.slice(0, 3).forEach((el, i) => {
        message += `${i + 1}. ${el.name} (${el.overflowPx}px over) - ${el.suggestion}\n`;
      });
      if (uniqueElements.length > 3) {
        message += `...and ${uniqueElements.length - 3} more element(s)`;
      }
    }

    setResult({
      fits: uniqueElements.length === 0,
      totalOverflowPx: totalOverflow,
      elements: uniqueElements,
      message,
    });
  }, [containerRef, ...deps]);

  return result;
}
