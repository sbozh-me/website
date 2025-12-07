import type { Persona } from "../types/persona";
import type { Post } from "../types/post";
import type { Tag } from "../types/tag";

export const mockPersonas: Persona[] = [
  {
    id: "1",
    name: "The Founder",
    slug: "founder",
    color: "#8b5cf6",
    description: "Project updates and announcements",
  },
  {
    id: "2",
    name: "Kagurame Sbozh",
    slug: "kagurame",
    color: "#f59e0b",
    description: "Creative writing and storytelling",
  },
  {
    id: "3",
    name: "Semenus",
    slug: "semenus",
    color: "#22c55e",
    description: "Philosophy and deeper thoughts",
  },
  {
    id: "4",
    name: "The Dude",
    slug: "dude",
    color: "#06b6d4",
    description: "Personal stories and experiences",
  },
];

export const mockTags: Tag[] = [
  { id: "1", name: "Tech", slug: "tech" },
  { id: "2", name: "Startup", slug: "startup" },
  { id: "3", name: "Philosophy", slug: "philosophy" },
  { id: "4", name: "Personal", slug: "personal" },
  { id: "5", name: "Creative", slug: "creative" },
];

export const mockPosts: Post[] = [
  {
    id: "1",
    title: "Why I started sbozh.me",
    slug: "why-i-started-sbozh",
    excerpt:
      "From side project to personal startup. The story of building something that matters...",
    content: `# Why I started sbozh.me

This is the story of how a simple idea became something more.

## The Beginning

It all started with a question: what if I built something just for me?

## The Journey

Building in public has its challenges, but also its rewards.

## What's Next

The roadmap is clear, the vision is set. Let's build.`,
    date: "2025-12-04",
    readingTime: 5,
    persona: mockPersonas[0],
    tags: [mockTags[0], mockTags[1]],
  },
  {
    id: "2",
    title: "On patience and shipping",
    slug: "on-patience-and-shipping",
    excerpt:
      "The tension between waiting for perfection and releasing into the world...",
    content: `# On patience and shipping

## The Paradox

We want things to be perfect. But perfection is the enemy of done.

## Finding Balance

Ship early, iterate often. But know when to wait.

## The Art of Timing

Sometimes the best code is the code you didn't write.`,
    date: "2025-12-01",
    readingTime: 3,
    persona: mockPersonas[2],
    tags: [mockTags[2]],
  },
  {
    id: "3",
    title: "Prague in winter",
    slug: "prague-in-winter",
    excerpt:
      "First snow, empty streets, and the best coffee spots when the tourists are gone...",
    content: `# Prague in winter

## The First Snow

There's something magical about Prague covered in white.

## Hidden Gems

The cafes that locals know. The streets that tourists miss.

## Winter Rituals

Hot chocolate, warm lights, and the sound of trams.`,
    date: "2025-11-28",
    readingTime: 4,
    persona: mockPersonas[3],
    tags: [mockTags[3]],
  },
  {
    id: "4",
    title: "The architecture of dreams",
    slug: "the-architecture-of-dreams",
    excerpt:
      "A short story about a city that builds itself from the memories of its inhabitants...",
    content: `# The architecture of dreams

## Chapter One

The city rose from nothing, shaped by thought alone.

## Chapter Two

Each building held a memory, each street a story.

## Chapter Three

And in the center, a tower that reached beyond the sky.`,
    date: "2025-11-15",
    readingTime: 8,
    persona: mockPersonas[1],
    tags: [mockTags[4]],
  },
  {
    id: "5",
    title: "Building a design system",
    slug: "building-a-design-system",
    excerpt:
      "How Obsidian Forge evolved from a color palette to a complete design language...",
    content: `# Building a design system

## Starting Point

Every design system starts with constraints.

## The Palette

Amethyst, gold, and terminal green. The colors of the forge.

## Components

From atoms to organisms. Building blocks that compose.

## The Result

A cohesive visual language that scales.`,
    date: "2024-10-20",
    readingTime: 6,
    persona: mockPersonas[0],
    tags: [mockTags[0]],
  },
];
