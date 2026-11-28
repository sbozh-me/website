"use client";

import { createContext, useContext, type ReactNode } from "react";
import { effectiveChoice } from "../choice-store";
import { SwitcherTabs } from "../switcher-tabs";
import { AI_VARIANTS, isAiVariant } from "./variants";
import { setAiVariant, useAiVariant } from "./store";

/** The variants the current post actually contains (empty blocks are dropped). */
const AvailableContext = createContext<readonly string[]>([]);

export function AiVariantProvider({
  variants,
  children,
}: {
  readonly variants: readonly string[];
  readonly children: ReactNode;
}) {
  return <AvailableContext.Provider value={variants}>{children}</AvailableContext.Provider>;
}

/**
 * One version of the post, emitted by remark-ai-variants from `:::ai` / `:::nai`. Only the
 * block of the effective variant is in the DOM: the reader's choice when the post has it,
 * otherwise the one the post contains.
 */
export function AiVariantBlock({
  variant,
  children,
}: {
  readonly variant: string;
  readonly children: ReactNode;
}) {
  const available = useContext(AvailableContext);
  const active = useAiVariant();
  if (!isAiVariant(variant) || variant !== effectiveChoice(active, available)) return null;
  return (
    <div className="ai-variant-block" data-variant={variant}>
      {children}
    </div>
  );
}

/** AI | No AI buttons above the post (inside the SwitcherBar). */
export function AiVariantSwitcher() {
  const available = useContext(AvailableContext);
  const active = useAiVariant();

  return (
    <SwitcherTabs
      label="Version"
      options={AI_VARIANTS.filter((variant) => available.includes(variant.code))}
      active={effectiveChoice(active, available)}
      onSelect={(code) => isAiVariant(code) && setAiVariant(code)}
    />
  );
}
