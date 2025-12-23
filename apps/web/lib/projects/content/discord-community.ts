import { siteConfig } from "@/lib/site-config";

export const discordCommunityContent = {
  about: `
This is a Discord server for builders.

Not just developers - builders of anything. Projects, skills, ideas, side quests, and unfinished work.

### Our Goal

The goal is simple: **make progress together**.

- Show what you're working on
- Ask when you're stuck
- Help when you can

### Who This Is For

You don't need to be an expert. You don't even need a project yet. If you're curious, learning, or just want to see how others build - you're welcome.

> As this community grows, this page will evolve to reflect how we work together.

### Join the Community

Ready to join? <a href="${siteConfig.links.discordInvite}" target="_blank" rel="noopener noreferrer">Click here to join the Discord server</a>
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
> Power gathers where people stand together.

### The Origin Story

My first community was a Garry's Mod group. Being part of it pushed me to make my first real project - a TF2 comic built from ragdolls, around 150 frames, edited scene by scene in Photoshop. It placed 3rd in comics of the year.

**That project existed because the community existed. I saw what others were making, and it gave me the push to try as well.**

### What Communities Create

Looking back, I'm certain that experience shaped who I became. It taught me to:
- Build things from scratch
- Actually finish what I start
- Enjoy the process of creating

And I'm grateful for that - because building something from nothing is a great feeling.

### Why Now

Today, with LLMs and modern tools, creating has never been more accessible.

What's still rare is a space that encourages you to:
- Show up consistently
- Try new things without fear
- Keep going when it gets hard

### The Vision

That's the kind of place I want to build. A community for people who share that feeling - and want to make things together.

Not just another Discord server. A place where projects come to life because the people are there to make it happen.
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

## 0.4.0 - First active members
- 0.4.0 - 10 active members

## ...

## 1.0.0 - Established Community
- Active daily discussions
- Regular community events
- Member-led initiatives
- Self-sustaining ecosystem
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
