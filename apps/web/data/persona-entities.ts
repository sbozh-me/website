import type { PersonaEntity } from "@/types/persona-entity"

export const personaEntities: PersonaEntity[] = [
  {
    id: "sem-bozhyk",
    name: "Sem Bozhyk",
    title: "Software Developer",
    description: "Building software solutions and leading technical teams. \n Ideal for startups and small companies",
    avatar: "/sem_bozhyk.png",
    status: { text: "Open to work", variant: "green" },
    ctaButtons: [
      { label: "View CV", href: "/cv", variant: "primary" }
    ],
    blogPersonaSlugs: ["the-founder", "the-architect"]
  },
  {
    id: "semen-bozhyk",
    name: "Semen Bozhyk",
    title: "Builder and Creator",
    description: "I turn ideas into reality, even weird ones.\n Join me on Discord or subscribe to follow the journey.",
    avatar: "/semen_bozhyk.png",
    status: { text: "In active fundraising mode", variant: "yellow" },
    ctaButtons: [
      { label: "Join Discord", href: "/projects/discord-community", variant: "primary" },
      { label: "#AINTTER", href: "/blog/aintter-as-a-name-for-ai-writing", variant: "outline" }
    ],
    blogPersonaSlugs: ["moris-grloris"]
  },
  {
    id: "viktor-bozhenko",
    name: "Viktor Bozhenko",
    title: "Proof of Concept Valuer",
    description: "I'm continuously investigating new opportunities in AI. \n I'll try your project and provide an honest report",
    avatar: "/viktor_bozhenko.png",
    status: { text: "Looking for collaborators", variant: "blue" },
    ctaButtons: [
      { label: "Blog", href: "/blog", variant: "primary" },
      { label: "What is this?", href: "/projects/sbozh-me", variant: "outline" }
    ],
    blogPersonaSlugs: []
  }
]
