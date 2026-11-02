import type { Avatar } from "@sbozh/blog/types";

import { createBlogRepository } from "@/lib/blog/repository";
import type { Author, CTAButton } from "@/types/author";

// Buttons that are behavior rather than content, keyed by avatar slug
const extraButtons: Record<string, CTAButton[]> = {
  "oktvian-claude": [
    { label: "Who is that?", action: "under-construction", variant: "outline" },
  ],
};

/** Avatars from Directus, in display order. Empty when Directus is unreachable. */
export async function getAvatars(): Promise<Avatar[]> {
  try {
    return await createBlogRepository().getAvatars();
  } catch (error) {
    console.error("Failed to fetch avatars:", error);
    return [];
  }
}

/** The home card for an avatar: its posts are the posts of its personas. */
export function toAuthor(avatar: Avatar): Author {
  const ctaButtons: CTAButton[] = [
    ...(avatar.cvUrl ? [{ label: "View CV", href: avatar.cvUrl, variant: "primary" as const }] : []),
    ...(extraButtons[avatar.slug] ?? []),
  ];

  return {
    id: avatar.slug,
    name: avatar.name,
    title: avatar.title ?? "",
    description: avatar.description ?? "",
    avatar: avatar.image,
    status: avatar.status && { text: avatar.status.text, variant: avatar.status.color },
    ctaButtons,
    blogAuthorSlugs: avatar.personas.map((persona) => persona.slug),
  };
}
