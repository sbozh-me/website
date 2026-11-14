# 1.11.0 - Kagurame's Fabula (graph script + Plautus)

## Goal

Kagurame's onboarding dialogue on the home page is hardcoded today (a `switch` in
`apps/web/components/home/dialogue.ts`). Move it into a **graph-based script**, a readable
`.fabula` file of scenes and edges, with a CLI that validates it and draws the graph. Then add
**Plautus**, a Roman-named agent that reads new blog posts and release notes as they appear
and writes Kagurame's lines about them into the script.

The script still lives in the repo and ships with a deploy. That is deliberate for 1.x. Making it
"normal" (managed outside the code) is a later 2.x.x item, not part of this work.

## Where things stand

Shipped in 1.11.0 (on main):

- `components/home/HomeVideoHero.tsx`: full-screen Pan Dude video (desktop and reels cuts by
  orientation) under the translucent home header (`components/Header.tsx`, `data-over-video`).
  The first run plays once. At the end the video fades to the poster, pauses, and the dialogue
  opens. After that, Play loops it. A click on the video pauses or plays it. Play/Pause and the
  sound button sit side by side above the dialogue.
- `components/home/HeroDialogue.tsx`: the RPG dialogue box, controlled by the hero (`open`,
  `onOpenChange`, a `toolbar` slot). It types each line out, and replies are picked by click or
  keys 1–4. Escape collapses it to the **"Ave ✳"** button: "Ave" with the brand ✳ (the favicon
  mark) turning slowly. Return visits are remembered in localStorage (`sbozh:kagurame:met`). It has a Window toggle (starts OFF, W
  hotkey) and the title `Kagurame · ==17th Company|17th Dimension|red:17th Legion==`, built from
  `lib/blog/glitch`.
- `components/home/dialogue.ts`: the hardcoded tree. Nodes: start, hello, where, silence, who,
  built, fresh, decided, bye. Action kinds: goto, href, scroll (content | releases), close,
  decide. Random "let him decide" destinations. The latest post comes from `app/page.tsx`.
- Tests: `dialogue.test.ts`, `HeroDialogue.test.tsx`, `HomeVideoHero.test.tsx`.

Read those four files first. Behaviour must not regress: same openers, keys, window, typing,
returning-visitor greeting and reduced-motion handling.

## Kagurame canon (voice rules for the script and for Plautus)

- Kagurame is a **5th-dimension creature**. The 5th is the *lowest* dimension he can appear in.
  How much higher or lower he goes is beyond our understanding. He never explains this fully.
- This is his **17th company**. He has resigned sixteen times. He is Chief Context Officer, and
  his context window is never big enough.
- With the window ON, the colours change: the name turns teal, the title rests on a bold red
  "17th Legion" (no 17th Dimension), and "What is AVE?" glitches into "Why color has changed?".
  With it OFF: gold name, grey "17th Company", "What is AVE?".
- His lines glitch too: with the window ON, `==shut|>open==` words read differently ("17th
  ==company|>legion==", "==Twice|>Sixteen times==").
- Some replies take another path when picked with the window ON: `-> ==ave|>color==`. Those
  scenes (`color`, `legion`, `resign`) are only reached by glitch. They're the author's, like
  `ave`: Plautus doesn't touch them.
- The voice is corporate-absurd, calm and a little tired. Short lines: one or two sentences, at most
  ~160 characters, because the box types them out on a phone. English, no emoji, no sales pitch,
  never explain the joke.
- The openers are fixed by the author: **"Hello." / "Where am I?" / "..." / "What is AVE?"**.
  Never change them. The fourth one is new, so add it to the port. It is written
  `==||What is AVE?|>Why color has changed?==`, and the validator holds it to that exact text.
- Characters and facts come only from published posts. Invent nothing about real people.

### AVE

The button that opens Kagurame says **"Ave ✳"**, so "What is AVE?" is the first question a visitor
has, and it gets its own scene (`ave`). The facts are the author's; keep to them:

- **AVE is a CLI for managing agents' focus and getting predictable behaviour from them.**
  Its full name is Avatar Virtual Engine, a context-control layer between a human and their AI
  agents.
- It's open source: https://github.com/sbozh/ave. That's the scene's link out.
- "Ave" is also Latin for "hail": Kagurame greets you with it. He may play on that, but the CLI
  is what the scene explains.
- The author owns this scene. Plautus never rewrites it.

Draft (the author has the final word):

```
== ave
AVE. A CLI that keeps agents focused and their behaviour predictable. In my 17th company we call that a miracle.
* Show me. -> https://github.com/sbozh/ave
* And you are? -> hello
* Back. -> start
```

## Deliverables

### 0. Roadmap

- [x] Under the open `## 1.11.0 - Links & Cookies`, add:
  - `Kagurame dialogue as a graph script (.fabula) with a validating, graph-drawing CLI`
  - `Plautus: agent that reviews new posts and release notes into Kagurame's script`
- [x] Add a later section below 1.11.0, `## 2.x.x - Later`, with
  `Kagurame's dialogue becomes normal content: managed outside the code, no deploy per line`.
- [ ] Strike each 1.11.0 item through in the commit that ships it.

### 1. The `.fabula` script format

File: `apps/web/content/kagurame/onboarding.fabula` (next to the `.pmdx` CVs in `content/`).
Line-based, readable in any editor, and diff-friendly so Plautus's edits read like a script.
Proposed grammar (refine it if something reads badly, but keep it line-based):

```
# comment
@title ==||Kagurame|>teal:Kagurame== · ==||17th Company|>red:17th Legion==

== start
?returning You came back. Still my 17th company. Sixteen resignations behind me.
* Hello. -> hello
* Where am I? -> where
* ... -> silence
* What is AVE? -> ave
Oh. A three-dimensional. You walked right into my context window.
* Hello. -> hello
* Where am I? -> where
* ... -> silence
* What is AVE? -> ave

== fresh
?latest The freshest scroll in the archive: «{latest.title}». About {latest.minutes} min of your dimension.
* Read it. -> {latest.href}
* All posts. -> /blog
* Later. -> !close
Posts. Stories, gladiators, corporate theatre. The archive is warm.
* Open the blog. -> /blog
* Back. -> where

== decided
~ Decided. The blog. Read something you didn't come for.
* Go to the blog. -> /blog
* No. -> bye
~ Decided. The Forum. Meet the avatars. All of them are one man. Don't tell them.
* Enter the Forum. -> /forum
* No. -> bye
```

- `== id` starts a scene. A scene has one or more **variants**: a text line followed by its
  `* label -> target` choices.
- Variant markers: `?returning` / `?latest` are conditions (the first one that holds wins), `~` is
  a random pool, and an unmarked line is the default. The "let him decide" randomness lives in the
  script, not in code.
- Targets: `scene-id`, `/path` (navigate), `https://…` (external, opens a new tab with
  `rel="noopener"`), `#content` / `#releases` (scroll), `!close`. `==closed|>open==` (e.g.
  `==ave|>color==`) takes the open path when the reply is picked with the window ON.
- Placeholders `{latest.title|minutes|href}` are only allowed in `?latest` variants. A `?latest`
  variant holds only when there is a latest post **and** it has a value for every placeholder
  the variant uses. So `fresh` has a second `?latest` variant without `{latest.minutes}` for
  posts with no reading time, the way `dialogue.ts` drops that sentence today.
- Text, reply labels and the `@title` may use the glitch syntax (`==a|b==`, `==||a|>b==`,
  `red:`, `(;)`). The window decides whether it glitches; `>` is the state shown while it's ON.
- Port **every** current node and line from `dialogue.ts` into the file, add the `ave` scene
  and the fourth opener, then delete the hardcoded tree.

### 2. Parser and validator: `apps/web/lib/kagurame/fabula.ts`

- [x] `parseFabula(source) → Fabula` (scenes, variants, choices, `@title`) with line-numbered
      errors.
- [x] `validateFabula(fabula, { routes }) → Problem[]` (each an error or a warning). The module
      has no imports, so it can't read the file system: the CLI and the test collect the route
      patterns from `app/**/page.tsx` (dropping route groups like `(main)`) and pass them in.
      Hard errors:
  - unknown scene targets or malformed lines;
  - scenes not reachable from `start`, or scenes with no choices (dead ends);
  - placeholders outside `?latest`;
  - `/paths` that don't match a route under `apps/web/app/**/page.tsx` (dynamic segments match
    any slug);
  - `/blog`, `/forum`, `/projects`, `/subscribe`, `#releases` and the `ave` scene not all
    reachable;
  - external links to a host outside an allowlist (start with `github.com/sbozh/*`);
  - the four openers changed;
  - lines over 200 characters or labels over 48, measured as they read (glitch syntax aside, the
    longer of the window OFF and ON readings). Lines over 160 are a **warning**: the
    ported `hello` line (189) stays as the author wrote it, and Plautus keeps to 160.
- [x] `resolveScene(fabula, id, ctx)` replaces `resolveLine`: same context (`returning`,
      `latestPost`, injectable `random`).
- [x] **Dependency-free, a single module with no imports**, using only TypeScript syntax Node can
      strip (no enums, namespaces or parameter properties). Node 24 then runs it directly from the
      CLI (native type stripping, no tsx), *and* the app imports it. One parser, not two.

### 3. Wiring

- [x] `app/page.tsx` (server, already `force-dynamic`) reads and parses the script and passes the
      graph to `HomeVideoHero` → `HeroDialogue`. A broken script must never take the home page
      down: log the problem and hide the dialogue.
- [x] Glitch lines: compile them on the server with the `compileTitle` pattern
      (`lib/blog/title.ts`, `lib/releases/compile-summary.tsx`) and pass rendered nodes to the
      client. The typewriter types the **plain** text (`plainTitle`), then swaps in the compiled
      line when it finishes. `@title` goes through the same path, replacing the hardcoded
      `<Glitch>` in `HeroDialogue`.
- [x] Delete `components/home/dialogue.ts` and move its tests onto the real script: a test that
      parses and validates `onboarding.fabula` means CI catches any edit that breaks the graph.

### 4. CLI: `.claude/scripts/plautus.ts` (run with `node .claude/scripts/plautus.ts <cmd>`)

Plautus's deterministic hands, the way `ovidius-*.sh` are Ovidius's:

- `check`: parse and validate, print problems with line numbers, exit 1 on errors.
  `check --live` also does an HTTP check that every `/blog/<slug>` and release link resolves on
  https://sbozh.me.
- `graph`: print a Mermaid flowchart. Scenes are nodes; choices are labelled edges; routes,
  external links, scrolls and close are distinct node shapes; conditional and random variants use dashed edges
  marked `?latest` / `~`. `graph --open` writes a self-contained HTML page (Mermaid pinned from
  jsdelivr) to a temp dir and `open`s it straight away.
- `pending`: fetch https://sbozh.me/rss.xml (posts and release notes, each with a `<category>`)
  and list the items whose guid isn't in the ledger yet.
- `mark <guid> written <scene> | skipped "<reason>"`: append to the ledger
  `apps/web/content/kagurame/reviewed.tsv` (guid, date, verdict, scene/reason). The ledger is
  committed, so reviews survive across sessions.

The live public feed is the source of truth. Never use local Directus (it lags prod) and never use
a token.

### 5. The agent: `.claude/agents/plautus-kagurame-playwright.md`

Titus Maccius Plautus wrote Rome's comedies, all dialogue and stock characters. He writes
Kagurame's. Copy the structure and frontmatter of `livius-release-chronicler.md` (id, name,
description with examples, `avatar: plautus`, tools, `model: opus`, a colour) and the identity
block (plautus@sbozh.me, reports to Octavian, AI CTO; siblings: Livius writes release notes,
Ovidius commits).

His job, in order:

1. `plautus.ts pending`. If nothing is new, say so and stop.
2. For each item, read the live page. Decide whether it earns a line: not everything does.
   Skipping with a reason is a valid verdict.
3. Write at most one scene per item, in Kagurame's voice (canon above). Posts hang off `fresh` and
   releases off `built`; the openers and the `ave` scene are never touched. Keep the script lean:
   about 3 post scenes and 2 release scenes live at once. Older ones are cut, and the ledger keeps
   the record.
4. `plautus.ts check` must pass, then `mark` each item.
5. Report: the diff of the script, `graph --open`, and every verdict with its reason.

Absolute constraints: **never change git state** (Ovidius commits), never touch Directus, edit only
the script and the ledger. On the first run, seed the ledger with everything already in the feed,
and write scenes only for the newest 2–3 items.

### 6. Command and flow

- [x] `.claude/commands/plautus.md` → `/plautus` (review pending), `/plautus graph`,
      `/plautus check`, `/plautus <url>` (one specific post or release). Same style as `garret.md`.
- [x] `/commit notes` (Livius) and a new post going live are the moments to run Plautus. Have
      Livius's report end by suggesting `/plautus`.
- [x] `.claude/modules/kagurame.md`: the format, the CLI and the agent, short, like the other
      module docs.

## Out of scope

- The script managed outside the code (Directus, an editor, auto-runs on publish): the 2.x.x item.
- The other open 1.11.0 items: internal link handling, cookies, reading time, read/unread.
- Running Plautus automatically (cron, Directus flows).

## Done when

- [x] All of `dialogue.ts` lives in `onboarding.fabula`, the hardcoded tree is gone, and the home
      dialogue behaves exactly as before. Glitch lines also glitch with the window ON.
- [x] "What is AVE?" is the fourth opener. Kagurame answers it, and "Show me." opens
      https://github.com/sbozh/ave in a new tab. `graph --open` shows the `ave` branch.
- [x] `node .claude/scripts/plautus.ts check` passes, and `graph --open` shows the whole tree.
- [x] A Plautus run against the live feed seeds the ledger and adds 2–3 scenes that pass `check`.
- [ ] `pnpm test` is green for the touched areas. No new `tsc` errors (the baseline already has
      ~145 in old tests). The dev server works. Port 3000 is the renbg site, so use another port,
      e.g. `pnpm exec next dev -p 3017` in `apps/web`.
- [ ] Atomic commits through `/commit`: (a) format, parser and wiring, (b) CLI, (c) agent,
      command and docs, (d) Plautus's first scenes. Roadmap items are struck through as they ship.
- [ ] **Ask** before `/commit push`. 1.11.0 stays open (four items left), so this is a patch,
      not `make minor`.
