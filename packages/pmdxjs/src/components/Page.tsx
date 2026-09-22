"use client";

import { DEFAULT_COLUMN_GAP } from "./Columns";
import { cn } from "../lib/utils";
import { useDocumentConfig } from "../transformer/context";

import type { CSSProperties, ReactNode } from "react";

export interface PageProps {
  children: ReactNode;
  className?: string;
  /** Ratio of the page's last column layout; a secondary corner QR lines up with its last column */
  columns?: [number, number];
}

/**
 * Page dimensions in mm
 */
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

/**
 * Hand-drawn arrows drawn after a caption.
 * `above`: out to the right, then down into the code below.
 * `beside`: a long, low sweep rising to the right, into the code's side.
 */
const ARROWS = {
  above: {
    viewBox: "0 0 32 32",
    width: "7mm",
    height: "7mm",
    paths: ["M3 6 C 20 2, 28 10, 22 27", "M14 22 L 22 27 L 28 19"],
  },
  beside: {
    viewBox: "0 0 64 28",
    width: "16mm",
    height: "7mm",
    paths: ["M3 23 C 22 26, 42 18, 58 9", "M49 8 L 58 9 L 54 17"],
  },
} as const;

/** Space between the secondary caption's arrow tip and its code */
const SECONDARY_CAPTION_GAP = "2mm";

interface QrLabelProps {
  text: string;
  placement: "above" | "beside";
  style?: CSSProperties;
}

/**
 * Handwritten caption with an arrow pointing into a corner QR code
 */
function QrLabel({ text, placement, style }: QrLabelProps) {
  const arrow = ARROWS[placement];

  return (
    <span
      className={cn(
        "pmdxjs-page-qr-label",
        placement === "beside" && "pmdxjs-page-qr-label-beside",
      )}
      style={{
        display: "inline-flex",
        alignItems: placement === "above" ? "flex-start" : "flex-end",
        gap: "3mm",
        marginRight: "1mm",
        fontSize: "0.7rem",
        lineHeight: 1.2,
        color: "var(--cv-muted-foreground, #6b7280)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span className="pmdxjs-page-qr-label-text">{text}</span>
      <svg
        className="pmdxjs-page-qr-arrow"
        viewBox={arrow.viewBox}
        width={arrow.width}
        height={arrow.height}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {arrow.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}

interface QrTileProps {
  href: string;
  size: number;
  path: string;
  logo?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Linked QR code on a white tile, with the logo over its centre
 */
function QrTile({ href, size, path, logo, className, style }: QrTileProps) {
  return (
    <a
      className={cn("pmdxjs-page-qr", className)}
      href={href}
      aria-label={`Open ${href}`}
      style={{
        position: "relative",
        display: "block",
        width: "26mm",
        height: "26mm",
        padding: "1.2mm",
        boxSizing: "border-box",
        background: "#ffffff",
        borderRadius: "1mm",
        lineHeight: 0,
        ...style,
      }}
    >
      <svg
        className="pmdxjs-page-qr-code"
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        role="img"
        aria-label="QR code"
      >
        <path d={path} fill="#111111" />
      </svg>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="pmdxjs-page-qr-logo"
          src={logo}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "7.5mm",
            height: "7.5mm",
            transform: "translate(-50%, -50%)",
            background: "#ffffff",
            padding: "0.5mm",
            borderRadius: "0.8mm",
            boxSizing: "border-box",
          }}
        />
      )}
    </a>
  );
}

/**
 * Left offset of a page's last column, as CSS: the columns grid splits the
 * content width minus one gap by `ratio`, so the last column starts one
 * gap after the first column's share.
 */
function lastColumnStart(
  [first, last]: [number, number],
  pageWidth: number,
  marginLeft: number,
  marginRight: number,
): string {
  const contentWidth = pageWidth - marginLeft - marginRight;
  const firstShare = first / (first + last);
  return `calc(${marginLeft}mm + (${contentWidth}mm - ${DEFAULT_COLUMN_GAP}px) * ${firstShare} + ${DEFAULT_COLUMN_GAP}px)`;
}

/**
 * Page component - represents a single page in the document
 *
 * Applies page sizing based on format (A4/Letter) and margins from config.
 * The bottom-right corner of the content area can carry a `logo`, or a `qr`
 * code (with the logo in its centre and an optional `qr-label` caption), and
 * a `version` line beneath — all from the document config, on every page.
 * A `qr-secondary` code sits left of the main one, level with it, at the start
 * of the page's last column; its optional `qr-secondary-label` caption sits
 * out to its left, toward the page centre, with an arrow into its side.
 */
export function Page({ children, className, columns }: PageProps) {
  const config = useDocumentConfig();
  const size = PAGE_SIZES[config.format];
  const [marginTop, marginRight, marginBottom, marginLeft] = config.margins;
  const qr =
    config.qr && config.qrPath && config.qrSize
      ? { href: config.qr, path: config.qrPath, size: config.qrSize }
      : null;
  const secondaryQr =
    config.qrSecondary && config.qrSecondaryPath && config.qrSecondarySize
      ? {
          href: config.qrSecondary,
          path: config.qrSecondaryPath,
          size: config.qrSecondarySize,
        }
      : null;
  // Rows: caption above, codes, version. With a secondary code the corner
  // spans the last column (left edge = where that column starts) and the
  // codes sit at either end of it.
  const cornerGrid: CSSProperties = secondaryQr
    ? {
        left: columns
          ? lastColumnStart(columns, size.width, marginLeft, marginRight)
          : undefined,
        gridTemplateColumns: "26mm 1fr 26mm",
        gridTemplateAreas: `"label label label" "secondary . qr" ". . version"`,
      }
    : { gridTemplateAreas: `"label" "qr" "version"` };

  return (
    <div
      className={cn(
        "pmdxjs-page",
        "relative",
        "mx-auto mb-8 last:mb-0",
        "shadow-lg print:shadow-none",
        "rounded-sm",
        "overflow-hidden",
        className,
      )}
      style={{
        width: `${size.width}mm`,
        height: `${size.height}mm`,
        padding: `${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm`,
      }}
    >
      {children}
      {(config.qr || config.logo || config.version || secondaryQr) && (
        <div
          className="pmdxjs-page-corner"
          style={{
            position: "absolute",
            right: `${marginRight}mm`,
            bottom: `${marginBottom}mm`,
            display: "grid",
            ...cornerGrid,
            justifyItems: "end",
            columnGap: "5mm",
            rowGap: "1mm",
          }}
        >
          {qr ? (
            <>
              {config.qrLabel && (
                <QrLabel
                  text={config.qrLabel}
                  placement="above"
                  style={{ gridArea: "label" }}
                />
              )}
              <QrTile {...qr} logo={config.logo} style={{ gridArea: "qr" }} />
            </>
          ) : (
            config.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="pmdxjs-page-logo"
                src={config.logo}
                alt=""
                aria-hidden="true"
                style={{
                  width: "9mm",
                  height: "auto",
                  display: "block",
                  gridArea: "qr",
                }}
              />
            )
          )}
          {config.version && (
            <span
              className="pmdxjs-page-version"
              style={{
                gridArea: "version",
                alignSelf: "start",
                fontSize: "0.55rem",
                lineHeight: 1.2,
                letterSpacing: "0.04em",
                color: "var(--cv-muted-foreground, #6b7280)",
                whiteSpace: "nowrap",
              }}
            >
              {config.version}
            </span>
          )}
          {secondaryQr && (
            <>
              <QrTile
                {...secondaryQr}
                logo={config.qrSecondaryLogo ?? config.logo}
                className="pmdxjs-page-qr-secondary"
                style={{ gridArea: "secondary" }}
              />
              {config.qrSecondaryLabel && (
                <QrLabel
                  text={config.qrSecondaryLabel}
                  placement="beside"
                  style={{
                    // Shares the code's cell, then moves out to its left so
                    // the text reaches for the page centre; lifted a little so
                    // the arrow lands in the lower part of the code
                    gridArea: "secondary",
                    justifySelf: "start",
                    alignSelf: "end",
                    marginBottom: "-2mm",
                    marginLeft: "3mm",
                    paddingRight: "2mm",
                    transform: `translateX(calc(-100% - ${SECONDARY_CAPTION_GAP}))`,
                  }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
