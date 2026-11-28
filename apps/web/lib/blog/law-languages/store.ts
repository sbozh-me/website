"use client";

import { createChoiceStore } from "../choice-store";
import {
  DEFAULT_LAW_LANGUAGE,
  LAW_LANGUAGE_STORAGE_KEY,
  isLawLanguage,
  type LawLanguageCode,
} from "./languages";

/**
 * Which language a Law-type post shows, shared by every LawLanguageBlock on the page and
 * the switcher. The reader's choice lives in localStorage; the server renders with the
 * default (cs) and the first client effect reconciles.
 */
const store = createChoiceStore<LawLanguageCode>({
  storageKey: LAW_LANGUAGE_STORAGE_KEY,
  fallback: DEFAULT_LAW_LANGUAGE,
  isValid: isLawLanguage,
});

export const setLawLanguage = store.set;
export const useLawLanguage = store.use;
