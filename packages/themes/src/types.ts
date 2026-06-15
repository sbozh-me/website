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
  {
    id: "kognitiv",
    name: "KOGNITIV",
    description: "Techno-thriller reading experience - Cold War command centers, declassified briefings",
  },
  {
    id: "roman-empire",
    name: "Roman Empire",
    description: "Imperial decree & senatorial letter aesthetic - ancient parchment, Roman inscriptions",
  },
];

export const DEFAULT_THEME = "obsidian-forge";

export const themeConfig: ThemeConfig = {
  defaultTheme: DEFAULT_THEME,
  themes: THEMES,
};
