"use client";

import { cn } from "../lib/utils";
import { useDocumentConfig } from "../transformer/context";

import type { ReactNode } from "react";

export interface PageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page dimensions in mm
 */
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

/**
 * Page component - represents a single page in the document
 *
 * Applies page sizing based on format (A4/Letter) and margins from config.
 * The bottom-right corner of the content area can carry a `logo`, or a `qr`
 * code (with the logo in its centre and an optional `qr-label` caption) —
 * both come from the document config and repeat on every page.
 */
export function Page({ children, className }: PageProps) {
  const config = useDocumentConfig();
  const size = PAGE_SIZES[config.format];
  const [marginTop, marginRight, marginBottom, marginLeft] = config.margins;

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
      {(config.qr || config.logo) && (
        <div
          className="pmdxjs-page-corner"
          style={{
            position: "absolute",
            right: `${marginRight}mm`,
            bottom: `${marginBottom}mm`,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "1mm",
          }}
        >
          {config.qr && config.qrPath ? (
            <>
              {config.qrLabel && (
                <span
                  className="pmdxjs-page-qr-label"
                  style={{
                    display: "inline-flex",
                    alignItems: "flex-start",
                    gap: "1mm",
                    marginRight: "1mm",
                    fontSize: "0.7rem",
                    lineHeight: 1.2,
                    color: "var(--cv-muted-foreground, #6b7280)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span className="pmdxjs-page-qr-label-text">{config.qrLabel}</span>
                  <svg
                    className="pmdxjs-page-qr-arrow"
                    viewBox="0 0 32 32"
                    width="7mm"
                    height="7mm"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {/* hand-drawn sweep: out to the right, then down into the code */}
                    <path d="M3 6 C 20 2, 28 10, 22 27" />
                    <path d="M14 22 L 22 27 L 28 19" />
                  </svg>
                </span>
              )}
              <a
                className="pmdxjs-page-qr"
                href={config.qr}
                aria-label={`Open ${config.qr}`}
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
                }}
              >
                <svg
                  className="pmdxjs-page-qr-code"
                  viewBox={`0 0 ${config.qrSize} ${config.qrSize}`}
                  width="100%"
                  height="100%"
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label="QR code"
                >
                  <path d={config.qrPath} fill="#111111" />
                </svg>
                {config.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="pmdxjs-page-qr-logo"
                    src={config.logo}
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
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="pmdxjs-page-logo"
              src={config.logo}
              alt=""
              aria-hidden="true"
              style={{ width: "9mm", height: "auto", display: "block" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
