import type { ReactNode } from "react";
import {
  Accordion as AccordionRoot,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@sbozh/react-ui/components/ui/accordion";

import "./accordion.css";

export const ACCORDION_DEFAULT_TITLE = "Previous version";

/**
 * A collapsed block of post text, e.g. the older version of a rewritten post:
 *
 *   <Accordion title="Original version (March 2025)">
 *
 *   The old text, in plain **markdown**.
 *
 *   </Accordion>
 *
 * Keep the blank lines after the opening tag and before the closing one, or MDX reads the
 * body as inline text instead of paragraphs. Closed by default; `open` starts it expanded.
 * Headings inside stay out of the table of contents (see remark-heading-ids).
 */
export function Accordion({
  title = ACCORDION_DEFAULT_TITLE,
  open = false,
  children,
}: {
  title?: string;
  open?: boolean;
  children?: ReactNode;
}) {
  return (
    <AccordionRoot
      type="single"
      collapsible
      defaultValue={open ? "item" : undefined}
      className="post-accordion"
    >
      <AccordionItem value="item">
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  );
}
