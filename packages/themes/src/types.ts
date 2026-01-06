export interface Theme {
  id: string;
  name: string;
  description?: string;
}

export interface ThemeConfig {
  defaultTheme: string;
  themes: Theme[];
}

export const THEMES: Theme[] = [
  {
    id: "obsidian-forge",
    name: "Obsidian Forge",
    description: "Dark, spacious aesthetic with amethyst and gold accents",
  },
];

export const DEFAULT_THEME = "obsidian-forge";

export const themeConfig: ThemeConfig = {
  defaultTheme: DEFAULT_THEME,
  themes: THEMES,
};
