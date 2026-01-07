"use client";

import { useEffect, useState, type ReactNode } from "react";

interface ThemeLoaderOverlayProps {
  spinner: ReactNode;
}

/**
 * Full-page overlay that blocks until fonts load, then fades out.
 */
export function ThemeLoaderOverlay({ spinner }: ThemeLoaderOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 300);
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0d1117] transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      aria-hidden="true"
    >
      <div className="animate-spin" style={{ animationDuration: "2s" }}>
        {spinner}
      </div>
    </div>
  );
}
