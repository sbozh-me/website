export const sbozhMeContent = {
  about: `
**Personal startup**<Spark />

A developer. A platform. A decade of craft distilled into one place.

**sbozh.me** is where I build in public, share what I learn, and help others start their own thing. You get the work, the process, and the person behind it - no polish, no waiting until it's "ready."

The asterisk? You'll figure it out. I'm still figuring it out too.

---

## What Is This Project For

Three things:

**For me** - a place to build what I want to build publicly. A nexus for ideas, experiments, and everything I ship. It helps me to focus on what I want to achieve<Spark />

**For you** - a way to learn who I am and what I'm capable of. If you're hiring, collaborating, or just curious - the answer lives here, documented as I go.

**For builders** - proof that you can start with what you have. If watching my process helps you begin your own project, that's a win. If you need guidance through the early chaos - mentoring and consulting conversations are open. Reach me through [Discord](/projects/discord-community) or [book a call](/contact).

## Open Source & AI Development

The entire codebase is public. You can browse the [repository](https://github.com/sbozh-me/website) and follow the [Changelog](/projects/sbozh-me/changelog) to see what's happening.

Most development is done with AI assistance. That's not a disclaimer - it's an advantage. This project becomes a live experiment in human-AI collaboration: what works, what breaks, what's worth adopting. I review everything that ships, and documenting that process is part of what makes **sbozh.me** useful beyond just another portfolio site.

## Tech Stack

**sbozh.me** runs on my own VPS. No Vercel, no Netlify, no managed platforms.

The stack:
- **Next.js** - frontend and routing
- **Tailwind CSS** - styling
- **Directus** - headless CMS for blog and content
- **Self-hosted on VPS** - full control, full responsibility

I chose this setup because I wanted to own every layer. When something breaks, I fix it. When I want to experiment, nothing stops me. That's the tradeoff I prefer.
`,

  motivation: `
Content coming soon...
`,

  changelog: `
Content coming soon...
`,

  roadmap: `
Content coming soon...
`,
};

export function getSbozhMeTabContent(tabId: string): string | null {
  const content = sbozhMeContent[tabId as keyof typeof sbozhMeContent];
  return content ?? null;
}
