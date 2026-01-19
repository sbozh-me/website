import type { CSSProperties } from "react";

import { cn } from "../../lib/utils";

export interface ImageProps {
  /** Image URL or path */
  src: string;
  /** Width in pixels or percentage */
  width?: string;
  /** Height in pixels or percentage */
  height?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Image component for PMDXJS documents
 */
export function Image({
  src,
  width,
  height,
  alt = "",
  className,
}: ImageProps) {
  const style: CSSProperties = {};

  if (width) {
    style.width = width.includes("%") ? width : `${width}px`;
  }
  if (height) {
    style.height = height.includes("%") ? height : `${height}px`;
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      className={cn("pmdxjs-image", className)}
    />
  );
}
