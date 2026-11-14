/**
 * Kagurame's onboarding dialogue: an RPG conversation over the home video that walks a
 * visitor to the parts of the site. Kagurame is a 5th-dimension creature: the 5th is the
 * lowest he can appear in; how far higher or lower he goes is beyond our understanding.
 * This is his 17th company. Pure data plus a resolver, so the tree is testable
 * without rendering.
 */

export type Action =
  | { goto: NodeId }
  | { href: string }
  | { scroll: "content" | "releases" }
  | { close: true }
  /** Kagurame picks the destination himself */
  | { decide: true }

export interface Choice {
  label: string
  action: Action
}

export interface Line {
  text: string
  choices: Choice[]
}

export interface LatestPost {
  title: string
  slug: string
  readingTime?: number
}

export interface DialogueContext {
  latestPost?: LatestPost
  /** Has this visitor talked to Kagurame before */
  returning: boolean
  /** Injected so tests can pin the 17th-dimension decision */
  random?: () => number
}

export type NodeId =
  | "start"
  | "hello"
  | "where"
  | "silence"
  | "who"
  | "built"
  | "fresh"
  | "decided"
  | "bye"

const OPENERS: Choice[] = [
  { label: "Hello.", action: { goto: "hello" } },
  { label: "Where am I?", action: { goto: "where" } },
  { label: "...", action: { goto: "silence" } },
]

// Where Kagurame may send someone who lets him decide
const DESTINATIONS: { line: string; label: string; href: string }[] = [
  { line: "The blog. Read something you didn't come for.", label: "Go to the blog.", href: "/blog" },
  { line: "The Forum. Meet the avatars. All of them are one man. Don't tell them.", label: "Enter the Forum.", href: "/forum" },
  { line: "Projects. Things that shipped. Some of them even on purpose.", label: "See the projects.", href: "/projects" },
  { line: "Subscribe. I whisper into your inbox when something ships. Rarely. Politely.", label: "Subscribe.", href: "/subscribe" },
]

export function decideDestination(random: () => number = Math.random) {
  return DESTINATIONS[Math.floor(random() * DESTINATIONS.length) % DESTINATIONS.length]
}

export function resolveLine(id: NodeId, ctx: DialogueContext): Line {
  switch (id) {
    case "start":
      return ctx.returning
        ? {
            text: "You came back. Still my 17th company. Sixteen resignations behind me, and the context window is still too small.",
            choices: OPENERS,
          }
        : {
            text: "Oh. A three-dimensional. You walked right into my context window.",
            choices: OPENERS,
          }

    case "hello":
      return {
        text: "Hello. I am Kagurame, Chief Context Officer of my 17th company. I came down to the 5th dimension for you. It's the lowest I go. Higher and lower than that, your understanding doesn't reach.",
        choices: [
          { label: "What is this place?", action: { goto: "where" } },
          { label: "What's new?", action: { goto: "fresh" } },
          { label: "Bye.", action: { goto: "bye" } },
        ],
      }

    case "where":
      return {
        text: "sbozh.me. A personal startup. One man builds it in public and ships whatever survives. I am what survived.",
        choices: [
          { label: "What do you write?", action: { goto: "fresh" } },
          { label: "Who runs this place?", action: { goto: "who" } },
          { label: "What gets built here?", action: { goto: "built" } },
          { label: "Keep me posted.", action: { href: "/subscribe" } },
        ],
      }

    case "silence":
      return {
        text: "...  ...  Respect. Silence is the biggest context window there is. Do you want to scroll on alone, or shall I decide for you?",
        choices: [
          { label: "[Scroll on]", action: { scroll: "content" } },
          { label: "[Let him decide]", action: { decide: true } },
        ],
      }

    case "who":
      return {
        text: "The Forum. Several avatars of one man, each with its own CV. In my dimension they are one person. In yours, a team.",
        choices: [
          { label: "Enter the Forum.", action: { href: "/forum" } },
          { label: "And what gets built?", action: { goto: "built" } },
          { label: "Back.", action: { goto: "where" } },
        ],
      }

    case "built":
      return {
        text: "Projects. This very site, a laser-crystal e-shop, a Renesans demo. Every release has notes. I have read them all. Twice.",
        choices: [
          { label: "Show me the projects.", action: { href: "/projects" } },
          { label: "The release notes, please.", action: { scroll: "releases" } },
          { label: "Back.", action: { goto: "where" } },
        ],
      }

    case "fresh": {
      const post = ctx.latestPost
      if (!post) {
        return {
          text: "Posts. Stories, gladiators, corporate theatre. The archive is warm.",
          choices: [
            { label: "Open the blog.", action: { href: "/blog" } },
            { label: "Back.", action: { goto: "where" } },
          ],
        }
      }
      const minutes = post.readingTime ? ` About ${post.readingTime} min of your dimension.` : ""
      return {
        text: `The freshest scroll in the archive: «${post.title}».${minutes}`,
        choices: [
          { label: "Read it.", action: { href: `/blog/${post.slug}` } },
          { label: "All posts.", action: { href: "/blog" } },
          { label: "Later.", action: { close: true } },
        ],
      }
    }

    case "decided": {
      const pick = decideDestination(ctx.random)
      return {
        text: `Decided. ${pick.line}`,
        choices: [
          { label: pick.label, action: { href: pick.href } },
          { label: "No.", action: { goto: "bye" } },
        ],
      }
    }

    case "bye":
      return {
        text: "Fine. I'll be here, looping. Thirty-nine seconds at a time.",
        choices: [
          { label: "[Scroll on]", action: { scroll: "content" } },
          { label: "Wait, where am I?", action: { goto: "where" } },
        ],
      }
  }
}
