"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { effectiveChoice } from "../choice-store";
import { SwitcherTabs } from "../switcher-tabs";
import {
  AI_VARIANTS,
  AI_VARIANT_PARAM,
  isAiVariant,
  paramForVariant,
  type AiVariantCode,
} from "./variants";
import { aiVariantStore, setAiVariant, useAiVariant } from "./store";

interface AiVariantContext {
  /** The variants the current post actually contains (empty blocks are dropped) */
  readonly available: readonly string[];
  /** The variant the URL asked for (`?version=`), if any */
  readonly initial?: AiVariantCode;
}

const Context = createContext<AiVariantContext>({ available: [] });

/**
 * Wraps a post's body. `initial` is the version the URL asks for: the server renders it,
 * and it wins over the reader's remembered choice (and becomes the remembered one).
 */
export function AiVariantProvider({
  variants,
  initial,
  children,
}: {
  readonly variants: readonly string[];
  readonly initial?: AiVariantCode;
  readonly children: ReactNode;
}) {
  // Once per page, before the blocks below read the store, so they render the URL's choice
  useState(() => {
    if (initial) aiVariantStore.seed(initial);
  });
  // A link to the same post with another ?version= re-renders without remounting
  useEffect(() => {
    if (initial) setAiVariant(initial);
  }, [initial]);
  return <Context.Provider value={{ available: variants, initial }}>{children}</Context.Provider>;
}

function useShownVariant() {
  const { available, initial } = useContext(Context);
  const active = useAiVariant(initial);
  return { available, shown: effectiveChoice(active, available) };
}

/**
 * One version of the post, emitted by remark-ai-variants from `:::ai` / `:::nai`. Only the
 * block of the shown variant is in the DOM: the reader's choice when the post has it,
 * otherwise the one the post contains.
 */
export function AiVariantBlock({
  variant,
  children,
}: {
  readonly variant: string;
  readonly children: ReactNode;
}) {
  const { shown } = useShownVariant();
  if (!isAiVariant(variant) || variant !== shown) return null;
  return (
    <div className="ai-variant-block" data-variant={variant}>
      {children}
    </div>
  );
}

/** Puts the shown version in the address bar without a navigation. */
function writeVersionParam(code: AiVariantCode) {
  const url = new URL(window.location.href);
  const param = paramForVariant(code);
  if (url.searchParams.get(AI_VARIANT_PARAM) === param) return;
  url.searchParams.set(AI_VARIANT_PARAM, param);
  window.history.replaceState(null, "", url);
}

/**
 * AI | No AI buttons above the post (inside the SwitcherBar). Once the reader has a
 * choice (picked here, remembered, or opened from a `?version=` link), the URL carries it,
 * so a copied link opens the same version. A first-time reader keeps the clean URL.
 */
export function AiVariantSwitcher() {
  const { available, shown } = useShownVariant();

  useEffect(() => {
    if (!shown || !isAiVariant(shown) || !aiVariantStore.stored()) return;
    writeVersionParam(shown);
  }, [shown]);

  return (
    <SwitcherTabs
      label="Version"
      options={AI_VARIANTS.filter((variant) => available.includes(variant.code))}
      active={shown}
      onSelect={(code) => isAiVariant(code) && setAiVariant(code)}
    />
  );
}
