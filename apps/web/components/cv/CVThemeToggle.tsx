"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function CVThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("cv-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      updateDocument(saved);
    }
  }, []);

  const updateDocument = (newTheme: Theme) => {
    const doc = document.querySelector(".pmdxjs-document");
    if (doc) {
      doc.setAttribute("data-theme", newTheme);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("cv-theme", newTheme);
    updateDocument(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/80"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <>
          <SunIcon className="h-4 w-4" />
          <span>Light</span>
        </>
      ) : (
        <>
          <MoonIcon className="h-4 w-4" />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}
