"use client";

import { useEffect, useState } from "react";

export type OverflowDirection = "bottom" | "right" | "left";

export interface OverflowElement {
  name: string;
  type: string;
  overflowPx: number;
  direction: OverflowDirection;
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
 * Generate a helpful suggestion based on element type, overflow amount, and direction
 */
function getSuggestion(
  type: string,
  overflowPx: number,
  direction: OverflowDirection,
): string {
  const lines = Math.ceil(overflowPx / 14); // Approximate lines at ~14px line height

  // Horizontal overflow suggestions
  if (direction === "right" || direction === "left") {
    const side = direction === "right" ? "right" : "left";
    switch (type) {
      case "column":
        return `${side.charAt(0).toUpperCase() + side.slice(1)} column content too wide. Shorten text or reduce content by ~${overflowPx}px`;
      case "tags":
        return `Tags overflow ${side}. Remove ${Math.ceil(overflowPx / 60)} tag(s) or use shorter tag names`;
      case "entry":
        return `Entry content too wide. Shorten job title, company name, or dates`;
      case "header":
        return `Header overflows ${side}. Shorten name, subtitle, or contact info`;
      case "paragraph":
        return `Text too wide. Break into multiple lines or shorten by ~${Math.ceil(overflowPx / 6)} characters`;
      default:
        return `Content overflows ${side} by ${overflowPx}px. Reduce width or shorten text`;
    }
  }

  // Vertical overflow suggestions (bottom)
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
    case "column":
      return `Column content too tall. Remove ${lines} line${lines > 1 ? "s" : ""} from this column`;
    default:
      return `Reduce content by approximately ${overflowPx}px`;
  }
}

/**
 * Get column identifier (left/right) based on position within columns container
 */
function getColumnName(el: Element, columnsContainer: Element): string {
  const columns = columnsContainer.querySelectorAll(".pmdxjs-column");
  const index = Array.from(columns).indexOf(el);

  if (index === 0) return "Left column";
  if (index === 1) return "Right column";
  return `Column ${index + 1}`;
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
    const pageLeft = pageRect.left;
    const pageRight = pageRect.right;

    const overflowingElements: OverflowElement[] = [];

    // Check columns for horizontal overflow (most important for CV layout)
    const columnsContainers = page.querySelectorAll(".pmdxjs-columns");
    columnsContainers.forEach((columnsContainer) => {
      const columnsRect = columnsContainer.getBoundingClientRect();
      const columns = columnsContainer.querySelectorAll(".pmdxjs-column");

      columns.forEach((column) => {
        const columnRect = column.getBoundingClientRect();

        // Check if column content overflows its allocated space
        // by comparing scrollWidth to clientWidth
        const htmlColumn = column as HTMLElement;
        const horizontalOverflow = htmlColumn.scrollWidth - htmlColumn.clientWidth;

        if (horizontalOverflow > 0) {
          const columnName = getColumnName(column, columnsContainer);
          overflowingElements.push({
            name: columnName,
            type: "column",
            overflowPx: Math.round(horizontalOverflow),
            direction: "right",
            suggestion: getSuggestion("column", horizontalOverflow, "right"),
          });
        }

        // Check if column extends beyond page boundaries
        if (columnRect.right > pageRight) {
          const overflowPx = Math.round(columnRect.right - pageRight);
          const columnName = getColumnName(column, columnsContainer);
          overflowingElements.push({
            name: `${columnName} (page boundary)`,
            type: "column",
            overflowPx,
            direction: "right",
            suggestion: getSuggestion("column", overflowPx, "right"),
          });
        }

        if (columnRect.left < pageLeft) {
          const overflowPx = Math.round(pageLeft - columnRect.left);
          const columnName = getColumnName(column, columnsContainer);
          overflowingElements.push({
            name: `${columnName} (page boundary)`,
            type: "column",
            overflowPx,
            direction: "left",
            suggestion: getSuggestion("column", overflowPx, "left"),
          });
        }

        // Check if columns overlap each other
        if (columns.length === 2) {
          const [leftCol, rightCol] = Array.from(columns);
          const leftRect = leftCol.getBoundingClientRect();
          const rightRect = rightCol.getBoundingClientRect();

          // Check for overlap (left column's right edge past right column's left edge)
          if (leftRect.right > rightRect.left) {
            const overlapPx = Math.round(leftRect.right - rightRect.left);
            overflowingElements.push({
              name: "Columns overlap",
              type: "columns",
              overflowPx: overlapPx,
              direction: "right",
              suggestion: `Left and right columns overlap by ${overlapPx}px. Reduce content in left column or adjust column ratio`,
            });
          }
        }
      });
    });

    // Check all major content elements for vertical overflow
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

        // Vertical overflow (bottom)
        if (rect.bottom > pageBottom) {
          const overflowPx = Math.round(rect.bottom - pageBottom);
          const type = getElementType(el);
          overflowingElements.push({
            name: getElementName(el),
            type,
            overflowPx,
            direction: "bottom",
            suggestion: getSuggestion(type, overflowPx, "bottom"),
          });
        }

        // Horizontal overflow (right) - check scrollWidth
        const htmlEl = el as HTMLElement;
        const horizontalOverflow = htmlEl.scrollWidth - htmlEl.clientWidth;
        if (horizontalOverflow > 0) {
          const type = getElementType(el);
          overflowingElements.push({
            name: `${getElementName(el)} (width)`,
            type,
            overflowPx: Math.round(horizontalOverflow),
            direction: "right",
            suggestion: getSuggestion(type, horizontalOverflow, "right"),
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
      const directionLabel =
        el.direction === "bottom" ? "vertically" : "horizontally";
      message = `${el.name} overflows ${directionLabel} by ${el.overflowPx}px. ${el.suggestion}.`;
    } else {
      message = `${uniqueElements.length} elements overflow the page:\n`;
      uniqueElements.slice(0, 5).forEach((el, i) => {
        const arrow =
          el.direction === "bottom" ? "↓" : el.direction === "right" ? "→" : "←";
        message += `${i + 1}. ${arrow} ${el.name} (${el.overflowPx}px) - ${el.suggestion}\n`;
      });
      if (uniqueElements.length > 5) {
        message += `...and ${uniqueElements.length - 5} more element(s)`;
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
