import type { Project } from "./types";
import packageJson from "../../../../package.json";

export const projects: Project[] = [
  {
    slug: "sbozh-me",
    title: "sbozh.me",
    tagline: "A platform where ideas turn into shipped products.\nBuilt in public. Learned in motion.",
    status: "beta",
    version: packageJson.version,
    heroImage: {
      src: "/images/projects/sbozh-me-hero.png",
      alt: "sbozh.me hero image",
    },
    meta: [
      { label: "Type", value: "Webapp" },
    ],
    tabs: [
      { id: "about", label: "About", enabled: true },
      { id: "motivation", label: "Motivation", enabled: true },
      { id: "releases", label: "Releases", enabled: true },
    ],
    links: [
      { type: "github", label: "Repository", href: "https://github.com/sbozh-me/website" },
    ],
  },
  {
    slug: "tecraft",
    title: "tecraft.cz",
    tagline: "Laser-engraved crystal keepsakes from your photo.\nWe make things people keep.",
    status: "beta",
    version: "0.11.3",
    heroImage: {
      src: "/images/projects/tecraft-hero.png",
      alt: "tecraft.cz showroom with a laser-engraved wedding photo inside a crystal on an LED base",
      position: "center",
    },
    meta: [
      { label: "Type", value: "E-shop" },
    ],
    tabs: [
      { id: "about", label: "About", enabled: true },
      { id: "motivation", label: "Motivation", enabled: true },
    ],
    links: [
      { type: "website", label: "tecraft.cz", href: "https://tecraft.cz", variant: "primary" },
    ],
  },
];

export function getProjects(): Project[] {
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
