"use client";

import type { ReactNode } from "react";
import { useLawAvailable } from "./available-context";
import { isLawLanguage } from "./languages";
import { useLawLanguage } from "./store";

/**
 * A block of body text written in one language. Only the block whose `lang` matches the
 * effective active language is in the DOM. The effective active is:
 *   - the reader's stored choice if the post has that language,
 *   - otherwise the first language the post actually contains.
 * So a post with only `:::lang en` renders its English body even when the stored default
 * is `cs`. Emitted by remark-law-languages from `:::lang xx` ... `:::`.
 */
export function LawLanguageBlock({
  lang,
  children,
}: {
  readonly lang: string;
  readonly children: ReactNode;
}) {
  const available = useLawAvailable();
  const active = useLawLanguage();
  if (!isLawLanguage(lang)) return null;
  const effective = available.includes(active) ? active : available[0];
  if (lang !== effective) return null;
  return (
    <div className="law-language-block" data-lang={lang}>
      {children}
    </div>
  );
}
