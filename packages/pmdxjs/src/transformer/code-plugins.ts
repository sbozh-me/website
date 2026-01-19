import type { CodeLanguagePlugin } from "../types/plugins";

/**
 * Resolve a code language plugin for a given language
 *
 * @param language - The language identifier from the code block (e.g., "typescript", "mermaid")
 * @param plugins - Array of registered plugins to search
 * @returns The matching plugin, or null if no match found
 */
export function resolveCodePlugin(
  language: string | null,
  plugins: CodeLanguagePlugin[],
): CodeLanguagePlugin | null {
  if (!language) return null;

  const normalizedLang = language.toLowerCase();

  for (const plugin of plugins) {
    const normalizedPluginLangs = plugin.languages.map((l) => l.toLowerCase());
    if (normalizedPluginLangs.includes(normalizedLang)) {
      return plugin;
    }
  }

  return null;
}
