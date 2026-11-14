# Kagurame

> **Location**: `apps/web/content/kagurame/`, `apps/web/lib/kagurame/`, `components/home/HeroDialogue.tsx`
> **Status**: Production (1.11.0)

Kagurame's RPG onboarding dialogue over the home video. His lines are a script, not code: a
graph of scenes in a `.fabula` file, checked by a CLI and extended by the Plautus agent.

## Files

| File | Purpose |
|---|---|
| `content/kagurame/onboarding.fabula` | The script: scenes, lines, replies |
| `content/kagurame/reviewed.tsv` | Plautus's ledger: every feed item reviewed (guid, date, verdict, scene or reason) |
| `lib/kagurame/fabula.ts` | Parser, validator, resolver. No imports: the app and Node both run it |
| `lib/kagurame/script.tsx` | Server loader: reads, validates, compiles glitch lines; broken script → dialogue hidden |
| `lib/kagurame/onboarding.test.ts` | Validates the real script against the real routes (CI catches a broken graph) |
| `components/home/HeroDialogue.tsx` | The box: typing, replies, keys 1–4, Escape → "Ave ✳" |
| `.claude/scripts/plautus.ts` | CLI: `check`, `graph`, `pending`, `mark` |
| `.claude/agents/plautus-kagurame-playwright.md` | The agent that writes scenes about new posts and releases |

## Format

```
@title ==||Kagurame|>teal:Kagurame== · ==||17th Company|>red:17th Legion==

== fresh
?latest The freshest scroll: «{latest.title}». About {latest.minutes} min.
* Read it. -> {latest.href}
~ One line of a random pool.
* Go. -> /blog
The unmarked line: what he says otherwise.
* ==||Bye.|>I quit.== -> ==bye|>resign==
```

- `== id` starts a scene: lines (variants), each followed by up to 4 replies `* label -> target`.
- `?returning` / `?latest` are conditions (first that holds wins), `~` a random pool, unmarked
  the fallback. A `?latest` line holds only if the post has every placeholder it uses.
- Targets: scene id, `/path`, `https://…` (new tab, allowlisted), `#content` / `#releases`, `!close`.
- Glitch syntax (the blog's) works in lines, labels and the title. `==shut|>open==` reads "open"
  with the window ON (W). `-> ==a|>b==` goes to `b` when the reply is picked with the window ON.
- `\` escapes a line starting with a marker. `#` lines are comments.

## Rules the validator holds

Unknown or unreachable scenes, dead ends, placeholders outside `?latest`, `/paths` with no page
under `app/`, external hosts off the allowlist (`github.com/sbozh/`), the author's four openers
(exact text and paths), `/blog` `/forum` `/projects` `/subscribe` `#releases` and `ave` reachable,
more than 4 replies. Lines are measured as they read: over 160 warns, over 200 fails; labels over 48.

## Flow

1. A post goes live, or Livius drafts a release note (his report suggests `/plautus`).
2. `/plautus` → the agent runs `pending`, reads each live page, writes or skips, runs `check`,
   `mark`s every verdict, and reports the diff and `graph --open`.
3. Ovidius commits the script and the ledger; the next deploy ships the lines.

`/plautus graph` and `/plautus check` run the CLI without the agent.

## Design Decisions

- **In the repo, shipped with a deploy** (1.x). Managing the script outside the code is a 2.x.x item.
- **One parser**: erasable TypeScript only, so Node 24 strips the types and runs it from the CLI.
- **Compiled on the server**: glitch lines are typed as plain text (the window OFF or ON reading),
  then swapped for the rendered line.
- **Author vs Plautus**: the openers, `ave` and the glitch-path scenes are the author's. Plautus
  owns the `archive` / `shipped` hubs and `post-*` / `release-*` scenes, about 3 + 2 live at once.
- **Fails safe**: an unreadable or invalid script logs its problems and hides the dialogue;
  the home page still renders.
