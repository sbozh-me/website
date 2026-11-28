"use client";

import { effectiveChoice } from "../choice-store";
import { SwitcherTabs } from "../switcher-tabs";
import { useLawAvailable } from "./available-context";
import { LAW_LANGUAGES, isLawLanguage } from "./languages";
import { setLawLanguage, useLawLanguage } from "./store";

/**
 * Buttons above a Law-type post (inside the SwitcherBar): picks which `:::lang xx` block
 * is rendered. Only shows buttons for the languages the post actually contains (read from
 * LawAvailableContext). Hidden when the post has no language blocks at all. If the stored
 * choice isn't among the available ones, the first available is shown and highlighted
 * (same resolution as LawLanguageBlock).
 */
export function LawLanguageSwitcher() {
  const available = useLawAvailable();
  const active = useLawLanguage();

  return (
    <SwitcherTabs
      label="Language"
      options={LAW_LANGUAGES.filter((lang) => available.includes(lang.code))}
      active={effectiveChoice(active, available)}
      onSelect={(code) => isLawLanguage(code) && setLawLanguage(code)}
    />
  );
}
