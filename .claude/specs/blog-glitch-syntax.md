# Spec: branded ✳ censor, DICK PITCH mark and glitch words in blog posts

Status: proposal, agreed direction, not implemented. Written 2026-09-28 at the end of the
"pan-dude" video session so a fresh session can pick up the blog work.

## Goal

Pan Dude's stand-up post (draft in Appendix A) needs three inline effects that echo the
`media/pan-dude` video:

1. **✳ censor**: the site logo replaces one letter of a word (х✳й, D✳CK).
2. **DICK PITCH brand mark**: two-tone D✳CK / PITCH with a colour-flip glitch.
3. **Glitch words**: a word briefly glitches into a second meaning (себя → US,
   право → imperium), sometimes through several states, sometimes blinking repeatedly.

Plus one page-level effect: "Стендап начался (GLITCH BEGIN)": from that point on the text
starts glitching (exact behaviour undecided, see Open questions).

## Where things live

- Posts are MDX stored in Directus, rendered in `apps/web/app/(main)/blog/[slug]/page.tsx`
  via `@mdx-js/mdx` `evaluate()` with `remarkGfm`, `rehypeSlug`, `rehypePrettyCode`.
- Custom MDX components: `apps/web/lib/blog/mdx-components.tsx` (`blogMdxComponents`).
- Blog package: `packages/blog` (see `.claude/modules/blog.md`).
- Directus assets: `/api/assets/<id>` proxy (`apps/web/app/api/assets/[id]/route.ts`,
  now streams and supports Range, commit f26570e).
- The author writes in **Obsidian** (drafts contain `![[Pasted image …]]` embeds).
- UI rule from CLAUDE.md: use shadcn/ui from `@sbozh/react-ui` where a component fits.
- Tests are required for new code in apps/ (Vitest). Releases need 90% coverage.

## Syntax (proposed; confirm with the author before building)

Constraints that shaped it:
- **MDX runs `{…}` as JavaScript** and treats `<` as JSX, so no brace syntax.
- **Obsidian turns `[[…]]` into links**, so no double brackets.
- `==…==` is Obsidian's highlight: it looks right while writing, and remark-gfm leaves it
  as plain text, so a small remark plugin can own it.

| Effect | Syntax | Example |
|---|---|---|
| ✳ censor (one letter) | `(;)` | `Нах(;)й корпоративной работы` |
| DICK PITCH brand | `==D(;)ck pitch==` | `А мне куда останется сесть – ==D(;)ck pitch==?` |
| Glitch into a second meaning | `==base\|alt==` | `Для ==себя\|US==.` |
| Several states | `==a\|b\|c==` | `==EMPEROR\|IMPERIUM==` |
| Blinking (repeats) | `==base\|alt!==` | `нужно продавать ==стекло\|GLASS!==` |
| Glitch mode from here on | a line with only `==GLITCH==` | after `Стендап начался.` |

`(;)` is already used 6 times in the draft and is safe in MDX and Obsidian, so keep it.

Suggested implementation: a remark plugin, added to the `remarkPlugins` in `page.tsx`,
that rewrites these text patterns into MDX JSX nodes (`<Censor/>`, `<DickPitch/>`,
`<Glitch states={[…]} blink/>`, `<GlitchMode/>`), registered in `blogMdxComponents`.
Rewriting the text inside the plugin (not with regex over the raw MDX string) avoids
touching code blocks and links.

## Visual language (from the video, keep consistent)

- Colours (Obsidian Forge): amethyst `#8B5CF6`, gold/orange `#F59E0B`, obsidian
  `#0A0A0F`, glitch echo `#6CE8DB` (light teal, replaced terminal green in the video).
- Resting glitch word: base colour, thin horizontal slices shifted a few px (notches).
- Glitch burst: 2-5 frames at 24fps (~80-200ms): scale jump 110-128%, colour swap
  (gold / obsidian with amethyst outline / base), teal and obsidian echo copies offset
  6-10px, slices pushed 5-12px. Snap cuts, no easing.
- Flip: 4-frame flicker (new, old, new, new) that ends in the new state; colours swap
  base↔accent on each flip.
- ✳ logo: `apps/web/public/android-chrome-192x192.png` (purple left half, gold right).
  In the video it has a bold obsidian outline (see `media/pan-dude/logo.py`) and, on the
  flip, spins 3.14 turns (ease-out) and lands 50.4° off square. Rotating 180° swaps the
  halves, which matches the colour swap.
- DICK PITCH: D✳CK in amethyst, PITCH in gold; flip → D✳CK gold, PITCH amethyst.
- Respect `prefers-reduced-motion`: show the final state without animation.
- Reference implementation of all of this (for video, ASS subtitles + ffmpeg):
  `media/pan-dude/glitch.py` and `media/pan-dude/words.py` (timeline markup doc at top).

### Font

The video uses **Retron2000** (1001Fonts FFC licence, local only, gitignored). The licence
allows commercial use and webfont conversion and embedding, but forbids redistributing the
font or offering it for download. Serving it as a webfont on the site is a grey area.
Confirm with the author, or keep the blog text in the site fonts (Space Grotesk /
JetBrains Mono) and only borrow the glitch behaviour.

## Inventory of annotations in the draft (verbatim → proposed)

The author's intent needs confirming where marked "?". The main ambiguity is **which
word is the one that glitches**.

| # | Draft text | Proposed |
|---|---|---|
| 1 | `~~суи...~~ камминг-аут. - глитч` | ? strike + glitch; maybe `==~~суи...~~\|камминг-аут==` |
| 2 | `Для себя. (глитч - US)` | `Для ==себя\|US==.` |
| 3 | `в Праге … нужно продавать стекло (GLASS blinking glitch)` | `==стекло\|GLASS!==` |
| 4 | `Объявляю Принципат - glitch becoming emperor` | ? `==Принципат\|becoming emperor==` |
| 5 | `А мне куда останется сесть - glitch D(;)ck?` | `==сесть\|D(;)ck==` (confirmed: ordinary glitch, plain ✳ censor in the alt, NOT the DICK PITCH brand) |
| 6 | `Стендап начался (GLITCH BEGIN).` | glitch mode from here? |
| 7 | `Так вот знаменитый Cultural fit (Glitch - залупа коня).` | ? `==Cultural fit\|залупа коня==` |
| 8 | `паразитировать на камминг-ауте - glitch censored?` | `==камминг-ауте\|censored==` |
| 9 | `на уровень Демиургов? (Glitch Kagurame)` | `==Демиургов\|Kagurame==` |
| 10 | `это я о нас (glitch us)` | `==нас\|us==` |
| 11 | `А я не дурачек(Glitch emperor) to do so.` | `==дурачек\|emperor==` |
| 12 | `к квази-инженеру(glitch Петух: ряженый)` | `==квази-инженеру\|Петух: ряженый==` |
| 13 | `Но я же тоже квази-инженер(glitch black rooster).` | `==квази-инженер\|black rooster==` |
| 14 | `Я же Император.(Glitch Semen)` | `==Император\|Semen==` |
| 15 | `Имею право.(Glitch imperium)` | `==право\|imperium==` |
| 16 | `А мой(gitch our) Дарио` | `==мой\|our==` |
| 17 | `моя летающая свинья(Glitch Flying pig)` | `==летающая свинья\|Flying pig==` |
| 18 | `И ничего кроме комплимента (я тут не вижу - glitch I'll explain).` | `(==я тут не вижу\|I'll explain==)` |
| 19 | `держать твое внимание(glitch audience)` | `==внимание\|audience==` |
| 20 | `А вы не заметили? (глитч Форточка \| Window)` | ? `==заметили\|Форточка\|Window==` (states?) |
| 21 | `добавил вам контекста(глитч Coming-out)` | `==контекста\|Coming-out==` |
| 22 | `свой comming-out(glitch censored) прямым текстом` | `==comming-out\|censored==` |
| 23 | `Вот и все.(glitch naked)` | `==все\|naked==` |
| 24 | `Я цепляюсь за comming-out(Glitch Censored)` | `==comming-out\|Censored==` |
| 25 | `Вроде логично, (что нужно делать. - глитч Dick Pitch)` | `(==что нужно делать.\|D(;)ck pitch==)` |
| 26 | `Тут тоже свой Cultural fit. (Глитч Real Comming-out)` | `==Cultural fit\|Real Comming-out==` |
| 27 | `D(;)ck pitch - branded` | `==D(;)ck pitch==` |
| 28 | `Нах(;)й корпоративной работы ему(glitch us) не надо` | `==ему\|us==` |
| 29 | `Он летающая свинья - glitch Fly away, забыл?` | `==летающая свинья\|Fly away==` |

`(;)` censors already in the text: з(;)бись, х(;)й, Нах(;)й, х(;)уйня, D(;)ck (×2).

## Draft issues to fix with the author

- Broken nested link: `[билета]([https://sbozh.me/blog/dobroho-dnia-shanovni](https://sbozh.me/blog/sklo-bilia-horla))`,
  which has two different URLs. Ask which one is meant.
- Obsidian embed `![[Pasted image 20260924214320 1.png]]` won't render. Upload it to
  Directus and use `![alt](/api/assets/<id>)`. It's the "crystal knife" still used as the
  video's 25th frame.
- Unclosed strikethrough: `~~Отсутствие денег на психотерапевта`.
- Spelling drifts, which matter once they're inside syntax: comming-out / каминг-аут /
  камминг-аут; "gitch our"; "а ну другом" → "а на другом".
- Tone: the post is dark comedy (confirmed by the author). Don't sanitise it.

## Decisions (2026-09-28)

1. Syntax: **as proposed** (`(;)`, `==D(;)ck pitch==`, `==base|alt==`, `==a|b|c==`,
   `==base|alt!==`; a trailing `!` always means blink).
2. Per-row "?" intent: row 5 confirmed as an ordinary glitch (`==сесть|D(;)ck==`), so
   `(;)` must also work **inside glitch states** as a plain censor. Rows 1, 4, 7, 20 still open.
3. Trigger: one burst on **scroll into view**, then **random bursts every ~4-10s** while
   the word is visible. Hover/tap also fires one.
4. Rest state: **back to base** after each burst (the alt only shows during the burst).
5. GLITCH BEGIN: **deferred**. Build the glitch mechanisms first. `==GLITCH==` is not
   built yet.
6. Font: **Archivo Black** for glitched states (Latin only; Cyrillic falls back to Space Grotesk), **Rubik Glitch** for `red:` states (2026-09-28, `--glitch-font` / `--glitch-font-red` in glitch.css); `||` plain states keep the article font. No Retron2000 on the web.
7. ✳ spin: **only inside the DICK PITCH flip**. Plain `(;)` censors stay still.
8. Theme: **obsidian-forge**. A dedicated theme may come later, so keep glitch colours
   in CSS custom properties that a theme can override (no hard-coded hex in components).

## Implementation (2026-09-28)

- `apps/web/lib/blog/remark-glitch.ts`: the remark plugin (commit 6e511c5). A plain
  `==text==` becomes `<mark>` (Obsidian highlight). The `\=`, `\|`, `\!` and `\(`
  escapes opt a character out of the syntax.
- `apps/web/lib/blog/glitch/`: `plan.ts` (pure burst planner, seeded-rng testable),
  `glitch.tsx` (`Glitch`, `GlitchState`, `DickPitch`, client), `censor.tsx`, `glitch.css`.
  All are registered in `blogMdxComponents`, and the plugin is in the blog page's
  `remarkPlugins`.
- Colours: `--glitch-base/accent/obsidian/echo` default to the theme's primary, secondary
  and background (teal echo hex). A future theme only needs to override these variables.
- Where the implementation departs from the video, and why:
  - **Rest notch**: one 9-11% strip across the upper letters, nudged 2px. The video's two
    thin 3-4px strips read as a strikethrough at body-text size.
  - **Flip holds the alt**: flicker (new, old, new, new), then hold the alt clean for
    0.7-2.2s depending on its length (0.45s when blinking), then glitch back to base. A
    4-frame flicker alone is too short to read "Петух: ряженый".
  - **Held alt is backed with obsidian** so a wider alt covers its neighbours cleanly.
    It is centred on the base word and kept 8px inside the viewport.
  - **DICK PITCH toggles**: each burst swaps its colours and keeps them, and the ✳ gains
    3.14 turns per flip.
  - **`==sbozhed==`** (any case: sbozhed, Sbozhed, SBOZHED): the same kind of brand mark.
    "sbozh" purple, the rest ("ed") orange, in the case it was typed; each burst swaps the
    colours and keeps them. Shares the `.brand-mark` styles with D✳CK PITCH (no ✳ spin).
    `===sbozhed===` keeps it flipping with the window OFF. Inside `==a|b==` it is plain text.
- **Plain states and colours** (added after the first draft was converted):
  - `==LOL|No||yes==`: a state after `||` is plain. It uses the article's own weight and
    colour and has no resting notch, but the frames into and out of it still glitch.
  - `==||нас|us==`: a leading `||` makes the base plain, so the word reads as normal text
    until it glitches.
  - Default colours: the base is amethyst and glitched states are gold. A burst flashes
    gold, or amethyst on a gold state.
  - `gold:`, `purple:`, `teal:`, `white:`, `red:` or `pink:` at the start of a state picks its colour
    (case-insensitive, e.g. `==себя|teal:US==`). Other colons ("Петух: ряженый") and
    unknown names stay text. `red` is `--glitch-red`, which defaults to
    `--color-destructive`; `pink` is `--glitch-pink` (#ec4899).
- **Links**:
  - `[==билета|ticket==](url)`: the whole glitch word is a link.
  - `==склад|[Tecraft](url)==`: only that state is a link, clickable while it's shown.
  - Linked states default to teal (a colour prefix still wins) and get a thick 0.14em
    underline that overhangs the word by 0.3em on each side. It is drawn on the copies,
    so it glitches with them.
- **Window switch** (`==WINDOW==`, exactly, in capitals): an inline "Window ON / Window OFF"
  button (`glitch/window.tsx`, shadcn Button). With it OFF, every glitch word on the page
  renders as plain article text (links stay links), nothing bursts, and D✳CK PITCH stays
  as a static brand mark. Censors are unaffected. The setting isn't saved: it resets
  when the page is left, so a post without the button always glitches.
  `==WINDOW OFF==` is the same button, but the page starts OFF. The plugin then marks
  every Glitch/DickPitch in the post `windowOff`, so the server already renders them
  plain (no flash of glitching before hydration).
  The **W** key toggles the window on any page with the button. It matches the physical
  key (`event.code`), so it's the Ц key on a Cyrillic layout. It's ignored while typing in
  inputs, with Ctrl/Cmd/Alt held and on key repeat. There's one listener per page however
  many buttons it has.
- **Window video** (`<WindowVideo on="/api/assets/…" off="/api/assets/…" onPoster offPoster title />`,
  JSX on its own line): plays the ON cut while the window is open and the OFF cut while
  it's closed. Both stay mounted and the hidden one is paused. On a switch the incoming cut
  jumps to the outgoing one's timestamp (the cuts share their footage timeline). On a
  `==WINDOW OFF==` page the server renders the OFF cut. The latest renders are in
  `media/production/` (see its README).
- **Window-only** (`==|text==`, a leading `|`): shown and glitching while the window is ON;
  gone entirely (not in the server HTML either on a `==WINDOW OFF==` page) while it's OFF.
  Further states, colours and `!` work: `==|teal:a|b!==`. `{` can't be used for this
  because MDX treats it as JavaScript. The space before it stays, so an OFF sentence reads
  "Для себя ." unless the text is attached to the previous word.
- **Open-window rest** (`==shut|>open|…==`, a `>` before a state, before its colour):
  with the window OFF the word reads as the base; with it ON it rests on the `>` state,
  is sized by it, and its flips never show the base. Only the first `>` counts, and not on
  the base. Example: `==||не хватает. Кто форточку закрыл?|>надуло.|gold:ДАЙ ДЕНЕГ==`.
- **Window-button state** (`==a|WINDOW==` or `==a|WINDOW OFF==`, any state but the base,
  colour prefix allowed): the state is the Window button itself, held ~2s so it can be
  clicked; only the main copy is clickable, not the echoes, and it's out of the tab order.
  `WINDOW OFF` there also starts the page closed. It shares the page's switch but owns no
  hotkey and never resets the window (that's `WindowToggle`'s job).
  As the **base of a `>` word** (`==WINDOW OFF|>you opened the window==`) it's a real,
  tabbable button while the window is closed and is replaced by the `>` words once it's
  open, so that button disappears with the window ON. Without a `>` state a WINDOW base is
  left alone. It doesn't own the `W` hotkey, so a post still wants a `==WINDOW==` somewhere
  for keyboard readers.
- **Unclosable** (`===a|b===`): a glitch word the window can't close. It keeps bursting
  with the window OFF, including on a `==WINDOW OFF==` page. Everything else works inside
  it (`||`, colours, `!`, links), and `===D(;)ck pitch===` keeps the brand flipping.
  `==` and `===` never pair with each other, and runs of four or more `=` are text.
- Not built yet: `==GLITCH==` (GLITCH BEGIN, deferred), and TOC and heading ids for
  headings containing syntax (`extractHeadings` reads the raw markdown, so the TOC shows
  `==a|b==` literally).

## Open questions (ask first)

1. Confirm the `==…==` / `(;)` syntax, or pick another.
2. For each "?" row above: which word is the one that glitches, and what it turns into.
3. When does a glitch word trigger: on scroll into view (once), on hover/tap, or
   randomly while visible (like the video's bursts)?
4. What exactly does "GLITCH BEGIN" do to the rest of the page?
5. Retron2000 on the web (licence) vs site fonts.
6. Should the ✳ spin (3.14 turns) happen in the blog too, and on what trigger?
7. Does the blog's post-level `theme` (`@sbozh/themes`) need a variant for this post?

## Related video work (branch `worktree-kagurame-animation`, not on main)

- f26570e fix(api): stream range requests for asset proxy (also on origin
  `fix/asset-proxy-range-requests`)
- dcd3326, 39f7038, a5f59b0: `media/pan-dude` recipe (glitch captions, logo censor,
  spin, tracked variant). `build.sh` still builds the old plain-caption version.
- The rendered video to embed: `media/pan-dude/sbozhme_pan-dude-glitch-web.mp4` (or the
  `-tracked-web` variant), plus `sbozhme_pan-dude-poster.jpg`. Embed via
  `<video src="/api/assets/<id>" poster=… autoPlay loop muted playsInline />`.

## Appendix A: the draft (as pasted by the author, 2026-09-28)

```text
Те кто понимают одесские приколы - люди редкие.

Тех кто понимают что такое свобода и право - еще меньше.

> Ну наконец-то начался стендап.

Вопрос серьезный: на одном пики точеные, а ну другом корпоративная работа.

> Про форточку не забудь!

Куда сам сядешь, а куда Дарио Амодея посадишь?

> Про яйца и без уролога понятно было, лол

Ты зачем до сюда читал, если не слышал кто такой Дарио Амодей?

Это СЕО компании которая помогла мне спродюсировать ~~суи...~~ камминг-аут. - глитч

А ты что подумал?

Что я дурачек?

Все в таймштампах, публично, со всей историей изменений и абсолютно каждый пост с атрибуцией.

![[Pasted image 20260924214320 1.png]]

Забыли куда попали? Невнимательно читали? А ну быстро зашли на [Tecraft](https://sbozh.me/projects/tecraft) и скупили склад моих бюстов.

Продадите потом дороже. Будет таймштамп что еще ~~живой~~ didn't pitch yet.

Я серьезно. Переходи. Два клика. Я все вижу.

Как?

[Да я так в жизни разобрался](https://youtu.be/50nlHgRYp1I?si=0AzLqLsT0Ja3ZaN_), что мне умирать не страшно. Захотелось с шиком, как бизнесмен. Как пророк.

А как Император я с вами навсегда.

Я вам говорю - эту штука с Цифровым Приципатом это весело.

___

Для тех кто не понял - вот такое настроение это типичный завтрак одессита когда не живешь в Одессе.

Я ночь-две сна пустил на эту идею. Да и про такие ночи у меня даже трек есть.

Для себя. (глитч - US)

Быть Императором это же про хлеб и зрелища? Хватай обоими рукам, ведь в Одессу, к сожалению, мы уже не вернемся.

Знаешь как достать Одессу из одессита с его приколами? Для этого его нужно убить, понимаешь?

Мне хорошо только там, в Одессе. А в Праге чтобы жить хорошо - нужно продавать стекло (GLASS blinking glitch).

Мне всегда будет грустно. Я возвращаюсь в свой город только в мыслях.

Я уже забыл какого там.

А вы такие шо ты про город, мы поняли, ты любишь его.

Знаете что в Одессе?

Там моя Мама, там мой Папа. Бабушка, братья. Ну все.

А я в Праге. Объявляю Принципат - glitch becoming emperor пока мой город бомбят.

Но говорят привыкли, так что все ок. Скучаю просто.

Я маму очень люблю. Я бы выбирал куда посадить родную маму только в контексте машины понимаете?

Вы вообще в какой культуре живете, что у вас такие приколы?

Мои приколы прикольнее: у меня есть Дарио.

А чего у меня нет - так это денег маме на Феррари.

А я обещал.

## Дарио, так какой стул?

Hello Dario.

I want to offer you a chair in my Business Senate of sbozh.me

И знаете какой он бы он выбрал?

С пиками точеными.

А мне куда останется сесть - glitch D(;)ck?

Увидим.

Добро пожаловать в четвертую часть.

Стендап начался (GLITCH BEGIN).

## Cultural fit

Ух, ребят, читатели, хейтеры, скептики и благожелатели. Не рад я тут только безбилетникам. Вот всем чем могу ненавидеть - ненавижу. Дело в том, что без [билета]([https://sbozh.me/blog/dobroho-dnia-shanovni](https://sbozh.me/blog/sklo-bilia-horla)) - ты ни хрена не поймешь.

Дарио, можешь быть спокойным. Я не убью себя из-за твоей ИИшки.

Если начнете засуживать досмерти, ну, тогда, может-быть, и подумаю.

А сейчас поменяй штаны и пойми простую вещь:

Я маму люблю.

Папу хочу сделать гордым.

В один момент у меня это со слонами получилось, а сейчас вам всем и без мамы понятно что с этим сейчас возникают определенные трудности.

Так вот знаменитый Cultural fit (Glitch - залупа коня).

Вот скажи, уважаемый специалист с многолетним опытом, я когда говорю тебе вещи которые тебе не нравится слышать - это потому что мне зарплату не нравится получать?

Или вот ты думаешь что я себя не контролирую?

Читая этот стендап, да. Вопросики могут возникать.

Но а если серьезно? Вот я тебе сказал что решение идиотское. Плавно, с помощью дипломатии, по делу.

А ты держишь внимание только на том - как я посмел.

То-же самое и сейчас. Да как я посмел паразитировать на камминг-ауте - glitch censored? Хочу найти себе сабмиссив папика? Хм... Убить себя? Это какую конкретно часть?

Расскажите?

Какую часть себя нужно убить чтобы попасть на уровень Демиургов? (Glitch Kagurame)

Про ЭГО помним? А про завтрак?

Так вот дальше у меня дейлик.

Как вам вайб?

Так что идея с папиком выглядит з(;)бись.

А то что я еще на этой работе делаю?

Вот все эти мямли опять про работу начались - это я о нас (glitch us)

Корпоративному миру важно то, что слово ~~каминг-аут~~ употреблять нельзя. Это не friendly.

А я не дурачек(Glitch emperor) to do so.

Но я могу намекать.

Work-life balance такой. Спринт закрой.

Я все эти правила знаю и понимаю. Они не сложные.

Сложно смотреть как компания тратит уйму собственных денег на ветер из-за сверх-большого доверия к квази-инженеру(glitch Петух: ряженый) который хорошо себя продал.

Но я же тоже квази-инженер(glitch black rooster). Рыбак рыбака видит из далека, понимаете?

Разница только в том, что он бабки фармит на ферме. А там где он фермер - в Одессе он еле-еле поц.

Вот мой Cultural fit.

Поверьте, если мне что-то не нравится - я скажу.

И скажу дипломатично.

Я же Император.(Glitch Semen)

Имею право.(Glitch imperium)

## Интервью с СЕО

Это финальный этап в любую маленькую компанию. В большой компании СЕО кладет на тебя х(;)й - у него времени нет.

Но в любом случае - если тебе представился такой шанс, то это потому что этот человек хочет узнать кто ты, и что тебя привело в эту компанию.

Так вот.

Что меня привело к тому что я стал Императором? ~~Отсутствие денег на психотерапевта

Об этом позже.

Важно ведь то, с чем я к Дарио пришел.

Точнее, планирую придти.

Ты же подготавливаешься к встрече с СЕО.

А мой(gitch our) Дарио тоже писатель, знаете-ли.

А я прочитал. И даже сейчас 02:52 я пошел перечитывать.

И [конcтитуцию](https://www.anthropic.com/constitution) пошел перечитал.

Я уважаю этого человека.

Но я писатель-император.

По-этому любое упоминание Дарио в этом тексте - это не Дарио Амодеи в любых смыслах.

Это так зовут мою летающую свинью(Glitch Flying pig).

Вдохновился.

И ничего кроме комплимента (я тут не вижу - glitch I'll explain).

Мне нужно как-то держать твое внимание(glitch audience).

### Подготовка.

Что есть общего и у меня и у Дарио?

Я ведь то тоже петух, но не летаю.

А он еще и не птица.

Тупо бред.

> Чет сложна, Семен. Душно.

А вы не заметили? (глитч Форточка | Window)

Я в самом начале добавил вам контекста(глитч Coming-out)

#### Так что же общего и у меня и у Дарио?

Нас не читают внимательно.

#### А какие у меня вопросы?

Почему мне так сложно закрыть форточку, Дарио?

#### Что меня привело к Дарио?

Я хочу понять как я смог подать ИИ свой comming-out(glitch censored) прямым текстом, и он меня похвалил.

#### Че, умный сильно?

[Да.](https://sbozh.me/blog/sklo-bilia-horla#%D0%BD%D1%83-%D0%B2%D1%96%D0%BD-%D0%BD%D0%B0%D1%87%D0%B5-%D1%80%D0%BE%D0%B7%D1%83%D0%BC%D0%BD%D0%B8%D0%B9)

## Мысли перед интервью

Ну, читатель, шо, обратил внимание?

Сколько вопросов в подготовке? Пятый в моем питче.

Сейчас поймешь.

Мы живём в "3Д" мире: что это значит

> Началось...

### Многомерие

Ничего такого. Просто объясняю насколько мое эго многомерно.

Вот и все.(glitch naked)

#### 1D

Это просто факты. Слова. Термины.

То что ты просто взял и понял.

Неосязаемый момент.

#### 2D

Плоскость. Вот насколько ситуация плоская:

Я цепляюсь за comming-out(Glitch Censored) чтобы меня увидели и я стал писателем.

Че-то странное происходит.

Я цепляюсь за тему безопасноти использования ИИ.

У меня племянница растет и мне важно где она будет жить.

У друзей много детей.

Я расстался с девушкой и хочу детей.

Вроде логично, (что нужно делать. - глитч Dick Pitch)

Публичность она такая.

Нет, папика не ищу.

Но моя женщина должна понимать с кем живёт.

Тут тоже свой Cultural fit. (Глитч Real Comming-out)

Спойлер: На первое свидание только с прочитанным стендапом.

#### 3D

У человека реальные проблемы и я не понимаю его состояния.

Быть мне одиноким.

Знали бы вы шо еще мама рассказывала.

#### 4D

Я держу тебя в таком состоянии. По крайней мере, пытаюсь, как могу, понимаешь? От этого зависит моя жизнь и жизнь моих близких.

И вот все думают что это настоящее 4D.

Нет. Настоящее 4D это когда ты читаешь рассуждения про дебилов в секции где я у мамы умный - у тебя возникает мысль "Ты просто дебил".

То что ты типо текст читаешь в контексте диалога - это проекция 3D через 2D.

Это возможно потому что ты легко понимаешь обаизмерения.

А вот если ты мало думаешь - то скажу тебе по простому

Это плоская х(;)уйня с объемом чтобы ты меня читал.

#### 5D

Карьера инфоцигана?

D(;)ck pitch - branded

---

Почему Дарио выбирает стул с пиками точеными?

Нах(;)й корпоративной работы ему(glitch us) не надо

Он летающая свинья - glitch Fly away, забыл?

Идем на собеседование.

[TO BE CONTINUED]

*— Пан Дюде.*
```
