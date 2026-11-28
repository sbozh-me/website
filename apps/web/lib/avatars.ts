import type { Avatar } from "@sbozh/blog/types";

import type { AvatarMoves } from "@/lib/blog/glitch/plan";
import { createBlogRepository } from "@/lib/blog/repository";
import type { Author, CTAButton } from "@/types/author";

// Buttons that are behavior rather than content, keyed by avatar slug
const extraButtons: Record<string, CTAButton[]> = {
  "oktvian-claude": [
    { label: "Who is that?", action: "under-construction", variant: "outline" },
  ],
};

// How an avatar glitches while the window is open, keyed by slug. `shots`: photos it flashes
// through, square webp crops in public/images/avatars/<slug>/<shot>.webp. Without shots it
// glitches its own photo. `moves`: every frame turns, mirrors, scales at random.
const glitches: Record<string, { shots?: string[]; moves?: AvatarMoves }> = {
  // The photo shoot, the head in the same place in every crop
  "sem-bozhyk": {
    shots: [
      6163, 6165, 6166, 6167, 6168, 6169, 6170, 6171, 6172, 6173, 6175, 6176, 6177, 6178, 6179,
      6180, 6181, 6182,
    ].map(String),
    // Mirrored left to right, never upside down
    moves: { reflect: "sideways" },
  },
  // The marble version of the thinker, whatever his resting photo is: turned, mirrored any way, scaled
  "semen-bozhyk": { shots: ["statue"], moves: { rotate: true, reflect: "any", scale: true } },
  // The whole mask (the resting crop cuts its top off) and four illustrations: the statue with
  // the crystal knife, the rage, the DOGE cap, the masked one at the mic. Zoomed in at random.
  "oktvian-claude": { shots: ["mask", "statue", "rage", "doge", "stage"], moves: { scale: true } },
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
  const glitch = glitches[avatar.slug];

  return {
    id: avatar.slug,
    name: avatar.name,
    title: avatar.title ?? "",
    description: avatar.description ?? "",
    avatar: avatar.image,
    status: avatar.status && { text: avatar.status.text, variant: avatar.status.color },
    ctaButtons,
    blogAuthorSlugs: avatar.personas.map((persona) => persona.slug),
    ...(glitch && {
      glitch: {
        photos: (glitch.shots ?? []).map((shot) => `/images/avatars/${avatar.slug}/${shot}.webp`),
        moves: glitch.moves ?? {},
      },
    }),
  };
}
