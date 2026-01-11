import type { PersonaEntity } from "@/types/persona-entity"

export const personaEntities: PersonaEntity[] = [
  {
    id: "sem-bozhyk",
    name: "Sem Bozhyk",
    title: "Software Developer",
    description: "Building software solutions and leading technical teams. I write about architecture, best practices, and the business side of tech.",
    avatar: "",
    ctaButtons: [
      { label: "View CV", href: "/cv", variant: "primary" }
    ],
    blogPersonaSlugs: ["the-founder", "the-architect"]
  },
  {
    id: "semen-bozhyk",
    name: "Semen Bozhyk",
    title: "Builder and Creator",
    description: "Personal projects, community building, and creative exploration. Join me on Discord or subscribe to follow the journey.",
    avatar: "",
    ctaButtons: [
      { label: "Join Discord", href: "https://discord.gg/RQPdBBwjc8", variant: "primary" },
      { label: "Projects", href: "/projects", variant: "outline" }
    ],
    blogPersonaSlugs: ["moris-grloris"]
  },
  {
    id: "viktor-bozhenko",
    name: "Viktor Bozhenko",
    title: "Open Source Developer",
    description: "I build software and write about the process. Ask my AI anything, or let's work together.",
    avatar: "",
    ctaButtons: [
      { label: "Blog", href: "/blog", variant: "primary" },
      { label: "What is this?", href: "/projects/sbozh-me", variant: "outline" }
    ],
    blogPersonaSlugs: []
  }
]
