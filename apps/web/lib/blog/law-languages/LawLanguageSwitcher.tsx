"use client";

import { Button } from "@sbozh/react-ui/components/ui/button";
import { cn } from "@sbozh/react-ui/lib/utils";
import { useLawAvailable } from "./available-context";
import { LAW_LANGUAGES, type LawLanguageCode } from "./languages";
import { setLawLanguage, useLawLanguage } from "./store";

/**
 * Buttons above a Law-type post: picks which `:::lang xx` block is rendered. Only shows
 * buttons for the languages the post actually contains (read from LawAvailableContext —
 * the `:::*` rule that empty blocks don't claim UI space). A single-language law still
 * shows its one button so the reader sees which language the text is in. Hidden only
 * when the post has no language blocks at all. If the stored choice isn't among the
 * available ones, the block falls back to the first available (see LawLanguageBlock),
 * but the switcher keeps highlighting the stored choice until the reader picks a new one.
 */
export function LawLanguageSwitcher() {
  const available = useLawAvailable();
  const active = useLawLanguage();
  const buttons = LAW_LANGUAGES.filter((lang) => available.includes(lang.code));

  if (buttons.length === 0) return null;

  // Highlight the language whose block is actually rendering: the reader's stored choice
  // when the post has it, else the first available (same resolution as LawLanguageBlock).
  const effective = available.includes(active) ? active : available[0];

  return (
    <div
      role="tablist"
      aria-label="Language"
      className="not-prose mb-8 flex flex-wrap gap-2 border-b border-border/60 pb-4"
    >
      {buttons.map((lang) => {
        const isActive = lang.code === effective;
        return (
          <Button
            key={lang.code}
            type="button"
            role="tab"
            aria-selected={isActive}
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => setLawLanguage(lang.code as LawLanguageCode)}
            className={cn(
              "min-w-[3.5rem] font-mono text-xs tracking-wide",
              !isActive && "text-muted-foreground",
            )}
            title={lang.label}
          >
            {lang.short}
          </Button>
        );
      })}
    </div>
  );
}
