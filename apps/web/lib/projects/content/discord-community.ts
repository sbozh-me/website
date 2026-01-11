import { siteConfig } from "@/lib/site-config";

export const discordCommunityContent = {
  about: `
This is a private Discord space connected to sbozh.me.

It exists for people who want to go deeper than what I publish publicly.

## Here, you can:

- ask me questions directly
- discuss my work and decisions
- explore ideas, drafts, and thoughts I don’t share in public

This is not a general community or a social Discord.

It’s small by design and focused on thoughtful questions and real discussion.

## Access is private.

<a href="${siteConfig.links.substackAccount}" target="_blank" rel="noopener noreferrer">Substack</a> subscribers get access automatically.
Others may be invited based on a clear expression of interest.
`,

  rules: `
## Community Rules

### 🤝 Respect & Safety

**1. Treat everyone with respect.**
No harassment, witch hunting, sexism, racism, or hate speech.

**2. No spam or unsolicited self-promotion.**
Server invites, ads, or DMing members without permission = not okay.

**3. Keep it clean.**
No NSFW content - text, images, or links.

**4. Report issues to staff.**
If something feels off, let us know. We want this to be a safe space.

### 🚀 Building Together

**5. Share what you're building.**
Messy, unfinished, broken - doesn't matter. Show your work.

**6. Ask when you're stuck.**
No question is too basic. That's why we're here.

**7. Help when you can.**
If you know the answer, share it. Small help compounds.

**8. Finish things.**
Starting is easy. We're here to help each other cross the line.

---

*Questions? Ping @staff in Discord.*
`,

  motivation: `
> **Power gathers where people stand together.**

### The Origin Story

My first community was a Garry's Mod group. Being part of it pushed me to make my first real project — a TF2 comic built from ragdolls, around 150 frames, edited scene by scene in Photoshop. It placed 3rd in comics of the year.

**That project existed because the community existed. I saw what others were making, and it gave me the push to try as well.**

### What Communities Create

Looking back, I'm certain that experience shaped who I became. It taught me to build from scratch, finish what I start, and enjoy the process of creating.

Building something from nothing is a great feeling. But the best part was never the output — it was the people who showed up alongside me.

### Why Private

Today, with LLMs and modern tools, creating has never been more accessible. What's still rare is genuine connection.

I'm not interested in scale. I'm interested in depth.

I want to know who's here. I want to understand what you're building and why. I want conversations that go somewhere — and relationships that last beyond a single project.

### The Vision

This is a space for people who want to make things — and want to be known while doing it.

Not a server to scroll. A room to show up to.

If that resonates, introduce yourself. Tell me what you're working on.
`,

  roadmap: `
## ~~0.1.0 - Established server~~ ✅
- ~~0.1.0 - Register Server~~

## ~~0.2.0 - Invite Link~~ ✅
- ~~0.2.0 - Provide Registration Link~~
- ~~0.2.1 - Link attached to project~~

## ~~0.3.0 - Define rules~~ ✅
- ~~0.3.0 - Basic structure created~~
- ~~0.3.1 - Server permissions configured~~
- ~~0.3.2 - Post rules to server~~
- ~~0.3.3 - Post rules to project~~

## ~~1.0.0 - Established Community~~ ✅
- ~~Direction established~~

## 1.1.0 - First Circle
- 5-10 members who've introduced themselves
- At least one project shared
`,

  backlog: `
## Future Ideas
- Develop ideas
`,
};

export function getDiscordCommunityTabContent(tabId: string): string | null {
  const content = discordCommunityContent[tabId as keyof typeof discordCommunityContent];
  return content ?? null;
}

export function getDiscordCommunityRoadmapData() {
  return {
    roadmap: discordCommunityContent.roadmap || '',
    backlog: discordCommunityContent.backlog || ''
  };
}
