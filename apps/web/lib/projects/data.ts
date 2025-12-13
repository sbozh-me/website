import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "sbozh-me",
    title: "sbozh.me",
    tagline: "Platform built in public with Next.js and Tailwind CSS",
    status: "beta",
    heroImage: {
      src: "/images/projects/sbozh-me-hero.png",
      alt: "sbozh.me hero image",
    },
    meta: [
      { label: "Moto", value: "Personal startup*" },
      { label: "Type", value: "Platform" },
    ],
    tabs: [
      { id: "about", label: "About", enabled: true },
      { id: "motivation", label: "Motivation", enabled: true },
      { id: "changelog", label: "Changelog", enabled: true },
      { id: "roadmap", label: "Roadmap", enabled: true },
    ],
  },
  {
    slug: "discord-community",
    title: "Discord Community",
    tagline: "A community for everyone to learn, share, and grow together",
    status: "coming-soon",
    heroImage: {
      src: "/images/projects/discord-community-hero.png",
      alt: "Discord community preview",
    },
    meta: [
      { label: "Platform", value: "Discord" },
      { label: "Type", value: "Community" },
    ],
    tabs: [
      { id: "about", label: "About", enabled: true },
      { id: "motivation", label: "Motivation", enabled: true },
    ],
  },
];

export function getProjects(): Project[] {
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
