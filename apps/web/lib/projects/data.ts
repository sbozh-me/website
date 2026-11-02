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
      headerSrc: "/images/projects/tecraft-header.png",
      alt: "tecraft Gifts wordmark over the wooden-loft showroom",
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
  {
    slug: "renesans-inter",
    title: "Renesans Inter",
    tagline: "A mobile-first face for an addiction treatment centre on the Black Sea.\nOne tap from searching to talking to a person.",
    status: "coming-soon",
    version: "0.1.0",
    heroImage: {
      src: "/images/projects/renesans-inter-hero.png",
      headerSrc: "/images/projects/renesans-inter-header.png",
      alt: "Renesans Inter wordmark over a Black Sea dawn",
      position: "center",
    },
    meta: [
      { label: "Type", value: "Website" },
    ],
    tabs: [
      { id: "about", label: "About", enabled: true },
      { id: "motivation", label: "Motivation", enabled: true },
    ],
    links: [
      { type: "website", label: "Live demo", href: "/demo/renesans-inter", variant: "primary" },
      { type: "website", label: "ren.bg", href: "https://ren.bg" },
    ],
  },
];

export function getProjects(): Project[] {
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
