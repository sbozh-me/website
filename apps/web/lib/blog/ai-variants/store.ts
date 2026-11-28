"use client";

import { createChoiceStore } from "../choice-store";
import {
  AI_VARIANT_STORAGE_KEY,
  DEFAULT_AI_VARIANT,
  isAiVariant,
  type AiVariantCode,
} from "./variants";

/** Which version (AI / No AI) a post shows, shared by its blocks and the switcher. */
export const aiVariantStore = createChoiceStore<AiVariantCode>({
  storageKey: AI_VARIANT_STORAGE_KEY,
  fallback: DEFAULT_AI_VARIANT,
  isValid: isAiVariant,
});

export const setAiVariant = aiVariantStore.set;
export const useAiVariant = aiVariantStore.use;
