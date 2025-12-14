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

Ready to join? [Click here to join the Discord server](https://discord.gg/your-invite-link)
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
## 0.1.0 - Define Rules
- ~~0.0.1 - Register Server~~
- ~~0.0.2 - Provide Registration Link~~
- Link attached to project
- Basic structure created
- Server permissions configured

## ...

## 1.0.0 - Established Community
- Active daily discussions
- Regular community events
- Member-led initiatives
- Self-sustaining ecosystem
`,

  backlog: `
## Future Ideas
- Partner program for active builders
- Monthly build challenges
- Guest speaker series
- Community-driven tutorials
- Cross-project collaboration board
- Skills marketplace
- Mentorship matching system
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
