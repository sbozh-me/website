"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Rss } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sbozh/react-ui/components/ui/dropdown-menu";

import { FEED_PATHS, type FeedPaths } from "@/lib/feed/paths";

type Format = keyof FeedPaths;

const LABELS: Record<Format, string> = {
  rss: "Copy RSS URL",
  atom: "Copy Atom URL",
};

/** How long "Copied!" stays before the menu closes */
const COPIED_MS = 1200;

interface FeedMenuProps {
  feeds?: FeedPaths;
  className?: string;
}

/** RSS icon that opens a menu to copy the RSS or Atom feed URL */
export function FeedMenu({ feeds = FEED_PATHS.all, className }: FeedMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<Format | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(format: Format) {
    const url = new URL(feeds[format], window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // No clipboard (insecure context, denied): open the feed so the URL is in the address bar
      window.open(url, "_blank", "noopener");
      setOpen(false);
      return;
    }
    setCopied(format);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(false);
      setCopied(null);
    }, COPIED_MS);
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCopied(null);
      }}
    >
      <DropdownMenuTrigger
        aria-label="Feeds"
        // Sized like the 20px social icons it sits between, with the same hover lift
        className={`flex items-center rounded-md text-muted-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:text-primary data-[state=open]:-translate-y-0.5 data-[state=open]:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className ?? ""}`}
      >
        <span className="flex size-5 items-center justify-center rounded-[5px] border-2 border-current">
          <Rss className="size-3" strokeWidth={3} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-48 rounded-xl border-white/10 bg-popover p-1.5 font-mono shadow-xl"
      >
        {(Object.keys(LABELS) as Format[]).map((format) => {
          const isCopied = copied === format;
          const Icon = isCopied ? Check : Copy;
          return (
            <DropdownMenuItem
              key={format}
              // Keep the menu open so "Copied!" is seen; it closes itself after COPIED_MS
              onSelect={(event) => {
                event.preventDefault();
                void copy(format);
              }}
              // Theme accent is terminal green; the highlight stays neutral like the reference
              className="group/item gap-3 rounded-lg px-3 py-2.5 text-sm focus:bg-white/10 focus:text-foreground focus-visible:outline-none focus-visible:ring-0"
            >
              <Icon
                aria-hidden
                className={
                  isCopied
                    ? "text-green-500"
                    : "text-muted-foreground group-data-[highlighted]/item:text-primary"
                }
              />
              <span aria-live="polite">{isCopied ? "Copied!" : LABELS[format]}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
