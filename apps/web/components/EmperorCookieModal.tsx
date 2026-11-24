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
}

/**
 * The GDPR gate: two sides. ALLOW loads PostHog EU; DISMISS keeps only the
 * first-party Umami fallback. No X, no outside click, no Escape -- the gate is
 * only crossed by picking a side.
 */
export function EmperorCookieModal({ open, onAllow, onDismiss }: EmperorCookieModalProps) {
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
            Allow cookies for PostHog EU analytics, or dismiss and only
            cookieless Umami runs.
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
      </DialogContent>
    </Dialog>
  );
}
