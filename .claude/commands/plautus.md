---
description: Kagurame's script with Plautus [graph|check|<url>]
---

Kagurame's onboarding dialogue lives in `apps/web/content/kagurame/onboarding.fabula`
(see `.claude/modules/kagurame.md`). The user's input after `/plautus` picks what happens:

- `/plautus` - Use the plautus-kagurame-playwright agent to review every pending feed item (new
  posts and release notes on https://sbozh.me/rss.xml) into Kagurame's script.
- `/plautus <url>` - Use the plautus-kagurame-playwright agent to review that one post or release
  note, even if the ledger already has it.
- `/plautus graph` - No agent: run `node .claude/scripts/plautus.ts graph --open` and print the
  path it opened.
- `/plautus check` - No agent: run `node .claude/scripts/plautus.ts check --live` and report its
  output verbatim.

Plautus never commits. After a review, relay his verdicts and the script diff, and offer `/commit`.

`/commit push` runs Plautus on its own (release mode, on Livius's draft) before every release,
so `/plautus` is only needed between releases, e.g. right after a post goes live.
