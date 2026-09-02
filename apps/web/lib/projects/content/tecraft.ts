export const tecraftContent = {
  about: `
**Laser-engraved crystal keepsakes**<Spark />

A photo of someone you love, engraved inside clear crystal.

**tecraft.cz** turns a photo into a sub-surface point cloud and laser-engraves it *inside* a block of clear glass - a 2.5D image made of hundreds of thousands of points of light. The crystal plugs into a black LED light-base that glows the engraving from below. Family, pets, weddings, portraits.

The shop is bilingual - Czech at the root, English at \`/en\` - and the whole storefront is one 3D stage. The promo hero and the order wizard share a single persistent WebGL canvas, so a visitor never leaves the crystal.

---

## What you can do there

- **Craft your crystal** - pick one of three sizes, portrait or landscape, upload a photo, crop it, remove the background with one switch, place the engraving inside the block and watch the laser cloud re-bake live.
- **See it before it exists** - the preview is a real-time three.js scene with a hand-written glass shader: refraction, dispersion, total internal reflection and the "turning effect" of a real engraved block.
- **Pick the room** - the showroom has themes; the same crystal lit cold or warm, the way it will look on your shelf.
- **Order and pay** - delivery across the Czech Republic via Zásilkovna, PPL, DPD and Balíkovna with a live pickup-point map, DHL abroad. Sign in with an email link, no passwords.

## How it is built

Next.js 15, React 19, Tailwind CSS v4 and three.js via React Three Fiber - the same stack as sbozh.me, pushed a lot harder. Around the storefront sit small services: an order and pickup-point service, a preview service that runs the photo models (background mask, depth) on the server, a GPU worker that bakes the HD laser point cloud, and an invoice renderer that takes a PMDX document and returns a PDF - the same PMDXJS parser that renders the [CV](/cv) on this site.

Manufacturing is in Prague, in small batches.

## Building in public

tecraft is where the way of working I describe on sbozh.me gets stress-tested on a real product with real customers. Most of the code is written with AI agents under a written standing discipline - a set of "laws" committed to the repository that every agent has to read before it touches anything. What ships is reviewed by a human. What fails is written down as a closed door, so nobody walks into it twice.
`,

  motivation: `
> **Nobody keeps something because of its specification.**

## Why a physical product

sbozh.me is about building in public. But a website that only ever ships websites proves less than it could. I wanted a project where the code ends in an object on someone's shelf - where a bug is not a broken page but a wrong photo in a block of glass that has already left the laser.

tecraft is that project: a real shop, real orders, real delivery, and a product people buy for the moments they least want to lose - a birth, a wedding, a pet, someone who is gone.

## Why the 3D preview

The usual way to sell this is a stock photo and a promise. I didn't want to sell a promise. I wanted the customer to see *their* photo inside *their* crystal, turning in the light, before they pay - and to move it, crop it and add a line of text themselves.

That is why the storefront is one continuous 3D scene instead of a product page, and why most of the engineering went into a glass shader nobody asked for.

## Why build it this way

The interesting question was never "can I make an e-shop". It was: how far can one person, working with AI agents, take a product that needs a real-time renderer, image models, a checkout, carriers, invoices and a second language - without the codebase turning into mud?

The answer so far is a written discipline: laws the agents read before they act, closed doors they are not allowed to reopen, a handoff document that outlives any single session. That process is the part I am most likely to reuse. The crystal is the part that makes it worth it.
`,
};

export function getTecraftTabContent(tabId: string): string | null {
  const content = tecraftContent[tabId as keyof typeof tecraftContent];
  return content ?? null;
}
