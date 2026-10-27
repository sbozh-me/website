> **Prompt (verbatim):**
>
> Explore my ==D(;)CK SYNTAX==. I have a very explicit post because of a mental breack down. My goal is to keep the meaning because of context providing reference in my startup. And Only. I want you to mention this prompt in a dick_syntax.md file. The prompt should be at the top of the file. The title should Semen's Dick Syntax. In ave we call it SDS. Make a documentation how to use it color my reference.

# Semen's Dick Syntax (SDS)

SDS is the markup used in sbozh.me blog posts and release notes to censor words, glitch
words into a second meaning, and switch the whole effect layer on and off with the
**window**. Use it in the MDX you write (in Obsidian) and store in Directus.

The explicit post exists because of a breakdown. SDS keeps that meaning in context: a word
can say one thing and then glitch into what it really means, and the reader controls how
much of it they see.

- Parser: `apps/web/lib/blog/remark-glitch.ts` (remark plugin, works on the mdast, so code
  blocks, inline code and URLs are never touched)
- Components: `apps/web/lib/blog/glitch/` (registered in `mdx-components.ts`)
- Original design spec: `.claude/specs/blog-glitch-syntax.md`

## Why this syntax

- MDX runs `{…}` as JavaScript and reads `<` as JSX, so SDS avoids braces.
- Obsidian turns `[[…]]` into links, so SDS avoids double brackets.
- `==…==` is Obsidian's highlight: it looks right while writing, and the plugin owns it on
  the site.

## Cheat sheet

| What | Write | Renders as |
|---|---|---|
| Censor one letter with the ✳ logo | `х(;)й`, `з(;)бись` | `<Censor />` |
| DICK PITCH brand mark | `==D(;)ck pitch==` (any case) | `<DickPitch />` |
| sbozhed brand mark | `==sbozhed==` (any case) | `<Sbozhed />` |
| Glitch into a second meaning | `==себя\|US==` | `<Glitch>` with 2 states |
| Several states | `==a\|b\|c==` | `<Glitch>` with 3 states |
| Blinks repeatedly | `==стекло\|GLASS!==` | `<Glitch blink>` |
| Colour a state | `==себя\|teal:US==` | `<GlitchState color="teal">` |
| State that looks like article text | `==LOL\|No\|\|yes==` | `<GlitchState plain>` |
| Plain base (reads normal until it glitches) | `==\|\|yes\|No==` | plain base state |
| Link the whole glitch word | `[==a\|b==](url)` | linked states |
| Link one state only | `==a\|[b](url)==` | only `b` is a link |
| Keeps glitching with the window OFF | `===a\|b===` | `<Glitch unclosable>` |
| Only exists while the window is ON | `==\|text==` | `<Glitch windowOnly>` |
| Different rest word when the window is open | `==shut\|>open\|x==` | `<Glitch openState="1">` |
| A state that flashes the window button | `==a\|WINDOW==` | `<GlitchState window>` |
| Window button that becomes a word once open | `==WINDOW OFF\|>b==` | button base |
| Window ON/OFF toggle | `==WINDOW==` | `<WindowToggle />` |
| Same toggle, page starts OFF | `==WINDOW OFF==` | `<WindowToggle off />` |
| Plain highlight | `==text==` | `<mark>` |

## The window

The window is the reader's switch for the whole SDS layer.

- **ON**: glitch words burst and flip, `<Voice>` blocks take their colour, `<WindowVideo>`
  plays the ON cut, `windowOnly` words appear.
- **OFF**: glitch words rest as plain text, voices read as normal paragraphs,
  `<WindowVideo>` plays the OFF cut. Only `===unclosable===` words keep glitching.

Put `==WINDOW==` somewhere in the post to give the reader the button. Use `==WINDOW OFF==`
when the post should start closed, so the explicit layer is opt-in. The server then
renders every glitch word plain, so nothing flashes before the page hydrates.

## Colour reference

Prefix a state with `colour:` (case-insensitive) to pick its colour. The same names work
for `<Voice color="…">`.

| Name | Value | Use it for |
|---|---|---|
| `purple` | `--color-primary`, amethyst `#8B5CF6` | default base colour |
| `gold` | `--color-secondary`, gold `#F59E0B` | default accent / second meaning |
| `teal` | `#6CE8DB` (glitch echo) | links, the "real" meaning, the window |
| `white` | `--color-foreground` | neutral, quiet states |
| `red` | `--color-destructive`, fallback `#EF4444` | danger, censored; gets its own font face |
| `pink` | `#EC4899` | anything that needs to stand out from the brand pair |

Defaults without a prefix: the base rests in purple, flips swap to gold. Brand marks are
fixed: D✳CK purple / PITCH gold, flipping to D✳CK gold / PITCH purple. `sbozh` and `ed`
in sbozhed follow the same swap.

## Prefixes and escapes

Prefixes go at the start of a state, in this order: `>` then the colour.

- `>`: the state the word rests on while the window is open (`==shut|>teal:open==`).
- `gold:` / `purple:` / `teal:` / `white:` / `red:` / `pink:`: the state's colour.
- `!` at the very end of the glitch: blink.
- An empty state between pipes (`||`): the next state uses the article's own font and
  colour.

To write a literal syntax character, escape it: `\=`, `\|`, `\!`, `\(`.
`==` pairs across inline nodes, so a state may hold `~~strike~~`, `**bold**` and so on.

## Block components

Write these as JSX on their own lines in the MDX.

```mdx
<Voice color="purple">

— Dear Audience. The Founder speaks to you directly.

</Voice>
```

A speaker's lines, coloured only while the window is open. Unlike a glitch word it wraps,
so it can hold whole paragraphs.

```mdx
<WindowVideo on="/api/assets/<id>" off="/api/assets/<id>"
  mobileOn="/api/assets/<id>" mobileOff="/api/assets/<id>" title="Pan Dude" />
```

Two cuts switched by the window. Optional `onPoster`, `offPoster`, `mobileOnPoster`,
`mobileOffPoster`; mobile cuts play below the `md` breakpoint.

```mdx
<Video src="/api/assets/<id>" poster="/api/assets/<id>" title="Pan Dude" />
```

One silent looping video (landscape or Shorts), not tied to the window.

## Examples from the stand-up post

```mdx
А мне куда останется сесть – ==D(;)ck pitch==?

Для ==себя|US==.

Я же Император. ==Император|gold:Semen==

Имею ==право|IMPERIUM==.

Это так зовут мою ==летающую свинью|teal:Flying pig==.

А вы не заметили? ==Форточка|WINDOW==

Так что идея с папиком выглядит з(;)бись.
```

## Motion and accessibility

- Bursts are 2 to 5 frames at 24fps, snap cuts, no easing; a flip flickers new, old, new,
  new and holds the new state long enough to read.
- Random bursts fire every 4 to 10 s while the word is on screen; blinking words every
  1.2 to 2.6 s.
- `prefers-reduced-motion` shows the final state without animation.
