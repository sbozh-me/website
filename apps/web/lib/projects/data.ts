import type { Project } from "./types";
import packageJson from "../../../../package.json";
import { siteConfig } from "@/lib/site-config";

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
      { id: "changelog", label: "Changelog", enabled: true },
      { id: "roadmap", label: "Roadmap", enabled: true },
    ],
    links: [
      { type: "github", label: "Repository", href: "https://github.com/sbozh-me/website" },
    ],
  },
  {
    slug: "discord-community",
    title: "Discord Community",
    tagline: "For people who make things.\nShare what you're working on, get help when you're stuck.",
    status: "beta",
    heroImage: {
      src: "/images/projects/discord-community-hero.png",
      alt: "Discord community preview",
      position: "bottom",
    },
    version: "0.3.3",
    meta: [
      { label: "Platform", value: "Discord" },
      { label: "Type", value: "Community" },
    ],
    tabs: [
      { id: "about", label: "About", enabled: true },
      { id: "motivation", label: "Motivation", enabled: true },
      { id: "rules", label: "Rules", enabled: true },
      { id: "roadmap", label: "Roadmap", enabled: true },
    ],
    links: [
      { type: "discord", label: "Join Discord", href: siteConfig.links.discordInvite, variant: "primary" },
    ],
  },
];

export function getProjects(): Project[] {
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
