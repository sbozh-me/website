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
## Founder's View

I believe the best way to learn is to build something real - and share it before you feel ready.

Not tutorials. Not side projects that stay local. Real things that ship. Things people can use. Things that force you to solve problems you didn't anticipate.

Most developers I admire started the same way: they built something for themselves, put it out into the world, and let the work speak. I want to do the same. **sbozh.me** is where that happens.

## The Catalyst

I've reached a point where I'm overwhelmed with ideas I want to implement. The backlog keeps growing.

Then LLMs happened. Suddenly, work that felt like months became weeks. Things I couldn't reasonably do alone became possible. After a decade of building, it feels like I finally have both the proficiency *and* the tools to pioneer ideas I've been carrying in my head for years.

**sbozh.me** is how I document that process. If it works, you get a record of how it happened. If it fails, you get a record of the attempt - and something to learn from for the next iteration.

Either way, it ships.

## Why This Exists

I want to build things I care about, in public, and show that it's possible to start with what you have.

If watching the process helps you start your own project - great. If you need someone to help navigate the early chaos - I'm here. If you just want to see what gets built next - stick around.

That's it. No grand mission. Just building, sharing, and hopefully making someone sbozhed along the way.
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
