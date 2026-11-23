"use client";

import { Cookie } from "lucide-react";
import { Button } from "@sbozh/react-ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@sbozh/react-ui/components/ui/dialog";

interface EmperorCookieModalProps {
  open: boolean;
  onAllow: () => void;
  onDismiss: () => void;
  onKeepColors: () => void;
}

/**
 * The one choice the visitor is given: ALLOW (loads PostHog EU) or DISMISS
 * (keeps the first-party Umami fallback, and the site stays black and white).
 * No X, no outside click, no Escape: the gate is only crossed by picking a side.
 */
export function EmperorCookieModal({ open, onAllow, onDismiss, onKeepColors }: EmperorCookieModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
        data-emperor-cookie-modal
      >
        <div className="flex items-center justify-center">
          <Cookie className="h-10 w-10" aria-hidden />
        </div>
        <div className="space-y-1.5 text-center">
          <DialogTitle className="text-xl">Take The Piece</DialogTitle>
          <DialogDescription>
            Allow cookies and the colour comes back. Dismiss and the site keeps running
            in black and white.
          </DialogDescription>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          By taking the piece you're aware of{" "}
          <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
            Terms of Use
          </a>
          ,{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </a>{" "}
          and the{" "}
          <a
            href="/library/laws/declaration-of-the-digital-principate"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Digital Principate Declaration
          </a>
          .
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onDismiss} className="w-full sm:w-auto">
            DISMISS COOKIES
          </Button>
          <Button onClick={onAllow} className="w-full sm:w-auto">
            ALLOW cookies
          </Button>
        </div>
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onKeepColors}
            className="h-auto px-2 py-1 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground hover:underline underline-offset-2"
          >
            Dismiss and keep colors
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
