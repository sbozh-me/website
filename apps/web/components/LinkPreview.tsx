"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getLinkPreviewPath, type LinkPreviewMeta } from "@/lib/link-preview";

// OG images are 1200×630
const OG_ASPECT = 630 / 1200;
const CARD_MAX_WIDTH = 360;
const VIEWPORT_MARGIN = 12;
const GAP = 8;
const SHOW_DELAY_MS = 300;
// Matches the duration-200 fade classes below
const FADE_MS = 200;

interface Position {
  left: number;
  top: number;
  width: number;
}

interface PreviewState extends Position {
  path: string;
  /** null while the page's preview is still being fetched */
  meta: LinkPreviewMeta | null;
}

function positionFor(rect: DOMRect): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_MAX_WIDTH, vw - VIEWPORT_MARGIN * 2);
  const height = width * OG_ASPECT;

  const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), vw - width - VIEWPORT_MARGIN);

  // Prefer below the link; flip above when there is no room
  let top = rect.bottom + GAP;
  if (top + height > vh - VIEWPORT_MARGIN) {
    top = rect.top - GAP - height;
  }
  top = Math.min(Math.max(top, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vh - height - VIEWPORT_MARGIN));

  return { left, top, width };
}

// The SparkMark drawn around its exact center, so it spins in place
// (the "*" text glyph sits high in its line box and wobbles when rotated)
function SparkMark({ spinning }: { spinning: boolean }) {
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const arm = 9;
  const dx = arm * Math.sin(Math.PI / 3);
  const dy = arm * Math.cos(Math.PI / 3);

  return (
    <svg
      viewBox="-12 -12 24 24"
      aria-hidden="true"
      className={`h-12 w-12 ${spinning ? "motion-safe:animate-spin" : ""}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="-12" y1="-12" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradientId})`} strokeWidth="3" strokeLinecap="round">
        <line x1="0" y1={-arm} x2="0" y2={arm} />
        <line x1={dx} y1={-dy} x2={-dx} y2={dy} />
        <line x1={dx} y1={dy} x2={-dx} y2={-dy} />
      </g>
    </svg>
  );
}

// One stacked layer of the card; layers crossfade instead of swapping
function Layer({
  visible,
  testId,
  children,
}: {
  visible: boolean;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      data-visible={visible}
      className={`absolute inset-0 flex items-center justify-center bg-muted transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #8b5cf633, transparent 70%)" }}
    >
      {children}
    </div>
  );
}

// Spinning SparkMark until the page's preview and its image have loaded; then the image,
// or the static SparkMark with the page title when there is no image or it fails
function PreviewCard({ preview, open }: { preview: PreviewState; open: boolean }) {
  const image = preview.meta?.image ?? null;
  const title = preview.meta?.title ?? null;
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">("loading");

  const loading = !preview.meta || (image !== null && status === "loading");
  const showImage = image !== null && status === "loaded";
  const showFallback = !loading && !showImage;

  return (
    <div
      aria-hidden="true"
      data-testid="link-preview"
      data-open={open}
      className={`pointer-events-none fixed z-50 overflow-hidden rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 duration-200 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      style={{ left: preview.left, top: preview.top, width: preview.width }}
    >
      <div className="relative aspect-[1200/630] w-full">
        <Layer visible={loading} testId="link-preview-loading">
          <SparkMark spinning />
        </Layer>
        <Layer visible={showFallback} testId="link-preview-placeholder">
          <SparkMark spinning={false} />
          {title && (
            <div className="absolute inset-x-0 bottom-0 truncate border-t border-border bg-popover/90 px-3 py-2 text-sm font-medium text-foreground">
              {title}
            </div>
          )}
        </Layer>
        {image && status !== "failed" && (
          <img
            src={image}
            alt=""
            width={1200}
            height={630}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("failed")}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${showImage ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    </div>
  );
}

const metaCache = new Map<string, Promise<LinkPreviewMeta | null>>();

function loadMeta(path: string): Promise<LinkPreviewMeta | null> {
  let pending = metaCache.get(path);
  if (!pending) {
    pending = fetch(`/api/link-preview?path=${encodeURIComponent(path)}`)
      .then((response) => (response.ok ? (response.json() as Promise<LinkPreviewMeta>) : null))
      .catch(() => null);
    metaCache.set(path, pending);
  }
  return pending;
}

/** Clears fetched previews (tests). */
export function clearLinkPreviewMetaCache() {
  metaCache.clear();
}

/**
 * Shows the OG image of an internal page while a mouse hovers a link to it; pages without
 * their own OG image get the SparkMark placeholder with the page title. Works through event
 * delegation, so any internal `<a href>` on the page gets the preview without changes to the
 * component that renders it. External links and touch devices are skipped.
 */
export function LinkPreview() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [open, setOpen] = useState(false);
  const activeLink = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let showTimer: number | undefined;
    let exitTimer: number | undefined;

    // Fades the card out, then unmounts it
    const hide = () => {
      window.clearTimeout(showTimer);
      activeLink.current = null;
      setOpen(false);
      window.clearTimeout(exitTimer);
      exitTimer = window.setTimeout(() => setPreview(null), FADE_MS);
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link === activeLink.current) return;

      const path = getLinkPreviewPath(link.getAttribute("href") ?? "", window.location.href);
      if (!path) return;

      window.clearTimeout(showTimer);
      activeLink.current = link;
      // Start fetching right away so the delay hides the request
      const meta = loadMeta(path);
      showTimer = window.setTimeout(() => {
        if (activeLink.current !== link) return;
        // Show the card right away, spinning until the preview arrives
        window.clearTimeout(exitTimer);
        setPreview({ path, meta: null, ...positionFor(link.getBoundingClientRect()) });
        setOpen(true);
        void meta.then((resolved) => {
          if (activeLink.current !== link) return;
          if (!resolved) {
            hide();
            return;
          }
          setPreview((current) => (current?.path === path ? { ...current, meta: resolved } : current));
        });
      }, SHOW_DELAY_MS);
    };

    const onPointerOut = (event: PointerEvent) => {
      const link = activeLink.current;
      if (!link) return;
      const next = event.relatedTarget as Node | null;
      if (next && link.contains(next)) return;
      if (link.contains(event.target as Node)) hide();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("click", hide, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", hide, { capture: true, passive: true });

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(exitTimer);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("click", hide, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", hide, { capture: true });
    };
  }, []);

  if (!preview) return null;

  return <PreviewCard key={preview.path} preview={preview} open={open} />;
}
