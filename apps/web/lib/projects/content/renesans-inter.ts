export const renesansInterContent = {
  about: `
**A calmer front door for a treatment centre**<Spark />

Renesans Inter is an addiction treatment centre on the Black Sea coast, near the Golden Sands resort outside Varna. It has worked since 2010 - detox, rehabilitation and social adaptation for drug, alcohol, gambling and internet addiction - under its own patented recovery programme.

This project is a new face for it. The current site at [ren.bg](https://ren.bg) carries a lot of honest, useful material, but it was built for a desktop screen a decade ago. The people who land on it are mostly on a phone, often late at night, often looking for help for someone they love.

---

## What the demo does

The [live demo](/demo/renesans-inter) is a single mobile-first page in Bulgarian, built from the centre's own content:

- **Call first** - the phone, Viber and WhatsApp sit in a bar under the thumb on every screen. One tap, no menus.
- **What they treat** - six short cards instead of a wall of text.
- **The method** - detox, rehabilitation and social adaptation as three plain steps.
- **Packages and prices** - Express, Standard, Optima and Long, swipeable on a phone, with what each one includes and what it costs.
- **The place** - the sea five minutes away, the mineral springs, the airport transfer.
- **Self-tests** - the MAST, CRAFFT and DAST-10 questionnaires, one tap away.
- **Discretion** - anonymity and medical confidentiality answered up front, not at the bottom of a page.

## How it is built

A server-rendered page inside this site: Next.js 15, React 19 and Tailwind CSS v4, no client JavaScript beyond what Next ships. The questions fold with native \`<details>\`, the package cards scroll with CSS snap. It has its own palette - sea teal and dawn sand - and none of the sbozh.me chrome, so it reads as the centre's site, not mine.
`,

  motivation: `
> **The hardest call is the first one. The page should not make it harder.**

## Why this project

Someone searching for addiction treatment is rarely calm and never has time to read. Before they decide anything, they need to know three things: *can they help*, *is it discreet*, and *how do I reach a person*. The old site answers all three - somewhere below the fold, between price tables and news.

I wanted to see how much of that friction disappears when the same content is laid out for the phone in someone's hand: the call button always visible, prices stated plainly, confidentiality said first.

## Why build it in public

It is a quick demo, not a finished redesign - and that is the point of sbozh.me. Show the first version, learn from the people who use it, ship the next one.
`,
};

export function getRenesansInterTabContent(tabId: string): string | null {
  const content = renesansInterContent[tabId as keyof typeof renesansInterContent];
  return content ?? null;
}
