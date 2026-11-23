# Cookies Prompting

How the site asks a visitor to accept or dismiss cookies, and what each choice
does. The gate lives entirely on the client; the server never knows the
visitor's answer.

---

## The two surfaces

There are two places where the countdown and the modal live. Each page has
exactly one:

1. **Home hero** (`/`): the existing full-bleed Pan Dude video with its 3-2-1
   film leader. Owned by `apps/web/components/home/HomeVideoHero.tsx` +
   `apps/web/components/home/HeroLeader.tsx`.

2. **Corner widget** (every non-`/` page): a picture-in-picture Pan Dude clip
   pinned to the bottom-right, same 3-2-1 leader overlayed. Mounted globally in
   the root layout via `apps/web/components/CookieGate.tsx` →
   `apps/web/components/CookieCornerVideo.tsx`.

The hero and the widget never show at the same time — `CookieGate` flips the
widget off when the pathname is `/`.

The "Take The Piece" modal
(`apps/web/components/EmperorCookieModal.tsx`) is the same one on both
surfaces, mounted by `CookieGate`. It has two buttons and no close-X — the
visitor has to pick a side.

---

## The three states

Stored in `localStorage["cookie_decision"]`, read/written through
`apps/web/lib/privacy/decision.ts`:

| state       | meaning                                    |
|-------------|--------------------------------------------|
| `null`      | undecided — fresh visitor                  |
| `"dismiss"` | opted out of external cookies              |
| `"allow"`   | opted in                                   |

Also stored, in `sessionStorage["sbozh:leader_shown"]` (cleared on tab close):

| state | meaning                                                            |
|-------|--------------------------------------------------------------------|
| unset | this tab session hasn't shown the 3-2-1 yet                        |
| `"1"` | the hero or the widget has already run the countdown this session  |

---

## The flow

### First visit

1. The 3-2-1 leader plays (hero or corner widget, depending on the entry page).
   The site goes grayscale while it runs:
   - hero: `html:has([data-home-hero][data-bw])`
   - widget: `html:has([data-cookie-corner-video][data-counting])`

2. When the leader runs out (or is skipped), the decision is checked:
   - `decision !== "allow"` → `requestCookieModal()` fires → the modal opens.
   - `decision === "allow"` → the video just plays.

3. The modal pops over the video. Scroll locks (`body.style.overflow = hidden`),
   the video pauses (both the hero and the widget use the same pattern —
   `useCookieModalOpen()` subscribes to the modal state and pauses on `true`).

4. The visitor picks:
   - **ALLOW** → `decision = "allow"` → modal closes → scroll unlocks → video
     resumes → site is in color.
   - **DISMISS** → `decision = "dismiss"` → modal closes → scroll unlocks →
     video resumes → site stays grayscale (`<html data-site-bw>` is kept on).

### Dismissed revisitor

A visitor who dismissed keeps being nudged on every page load until they
switch:

- The corner widget still mounts on non-`/` pages
  (`cornerVisible = !isMain && initial !== "allow"`).
- The modal auto-opens again at the end of the countdown
  (`handleCornerLeaderDone` opens whenever `readDecision() !== "allow"`).
- The home hero's `endLeader` does the same thing with `requestCookieModal()`.
- The site stays grayscale throughout (`html[data-site-bw]` persists).

### Allowed visitor

- `cornerVisible` is `false` on all non-`/` pages — Pan Dude goes away.
- The hero's `endLeader` sees `decision === "allow"` and does not request the
  modal.
- No grayscale.

### One 3-2-1 per tab session

`sessionStorage["sbozh:leader_shown"]` makes the countdown a one-shot per tab:

- `HomeVideoHero` reads `wasLeaderShown()` on mount. If set, it flips `counting`
  to `false` and unmounts the leader (`skipLeader` state guards the
  `<HeroLeader />` render).
- `CookieCornerVideo` initializes `counting = !wasLeaderShown()` lazily — safe
  because `CookieGate` waits for its `hydrated` flag before mounting the widget
  (no SSR render path).
- Whichever surface finishes the countdown first calls `markLeaderShown()`.

Result: enter on `/projects`, watch the corner-widget 3-2-1, then go to `/` →
the hero video plays straight away, no second countdown. And vice versa. Tab
close + reopen resets.

---

## Keyboard and click shortcuts

### The 3-2-1 leader

- **Click anywhere on the countdown** → skips to the end. Same path the natural
  timeout takes, just faster (`setCount(0)` in `HeroLeader`). Triggers the same
  `onDone` → `endLeader` chain, so the modal still opens where it would have.

### The corner widget

Escape is a three-way, in priority order:

1. If the widget is full-screen → shrink back to the corner.
2. If the 3-2-1 is still counting → skip the countdown **and** open the modal
   (always, regardless of decision — so a dismisser can re-ask at any time).
3. Otherwise (video playing) → close the widget. If a decision exists, the
   widget just unmounts; if not, `onClose` falls back to opening the modal.

Three overlay buttons, centered along the widget's bottom edge:

- **Mute / Enable music** — toggles `video.muted`. Starts muted so autoplay
  works.
- **Full screen / Exit full screen** — grows the widget from the corner to
  `inset-0`, and back.
- **Close** — contextual: opens the modal if there's no decision yet, hides
  the widget if the choice is already made.

---

## The "Return colors" button

Fixed at bottom-center on every page, only renders when
`decision === "dismiss"` and the modal isn't already open. Click re-opens the
"Take The Piece" modal so the visitor can switch to allow.

This is the main way out of grayscale.

---

## Analytics

Routed by decision in `apps/web/providers/AnalyticsProvider.tsx`, which
subscribes to `useCookieDecision()`:

| decision   | scripts loaded                                     |
|------------|----------------------------------------------------|
| `null`     | nothing — no analytics until a choice              |
| `"dismiss"`| Umami (first-party, no cookies) as fallback        |
| `"allow"`  | PostHog EU (`eu.i.posthog.com`), session replay off |

Runtime config comes from `/api/config` (apps/web/app/api/config/route.ts),
exposed as `{umamiWebsiteId, umamiScriptUrl, posthogKey, posthogHost, enabled}`.
PostHog is lazy-loaded via `import('posthog-js')` in `AnalyticsProvider` and
initialised with `person_profiles: 'identified_only'` and
`disable_session_recording: true`. Flipping from `allow` to `dismiss` calls
`posthog.opt_out_capturing()` + `posthog.reset()` so the distinct_id cookie
is cleared.

---

## Grayscale rules

Three selectors in `apps/web/app/globals.css`, any of which grayscales the
whole page:

```css
html:has([data-home-hero][data-bw]),
html:has([data-cookie-corner-video][data-counting]),
html[data-site-bw] {
  filter: grayscale(1);
}
```

- `[data-home-hero][data-bw]` — on the hero while its 3-2-1 counts or the video
  hasn't started yet.
- `[data-cookie-corner-video][data-counting]` — on the corner widget while its
  3-2-1 counts.
- `html[data-site-bw]` — persistent, applied by `CookieGate` whenever
  `decision === "dismiss"`.

---

## Event bus

`apps/web/lib/privacy/decision.ts` dispatches three custom events on `window`:

| event                 | payload                | fired by           | listened by               |
|-----------------------|------------------------|--------------------|---------------------------|
| `cookie:decision`     | `CookieDecision`       | `setDecision()`    | `useCookieDecision()`     |
| `cookie:request`      | none                   | `requestCookieModal()` | `CookieGate` (main-page only) |
| `cookie:modal-state`  | `boolean` (open)       | `emitCookieModalState()` from `CookieGate` | `useCookieModalOpen()` (`HomeVideoHero`) |

---

## Tab visibility

Both the hero video and the corner-widget video pause on
`document.visibilityState === "hidden"` and resume on visible. The leader does
the same — its `paused` state is `away || hidden`, so an off-screen tab
doesn't burn through the countdown behind the visitor's back.

---

## File map

| file                                              | role                                                   |
|---------------------------------------------------|--------------------------------------------------------|
| `apps/web/app/layout.tsx`                         | mounts `<CookieGate />` globally                       |
| `apps/web/app/globals.css`                        | grayscale selectors, leader-film animations            |
| `apps/web/app/api/config/route.ts`                | serves analytics config incl. `posthogKey`/`posthogHost` |
| `apps/web/components/CookieGate.tsx`              | the root orchestrator: decision, widget, modal, button |
| `apps/web/components/CookieCornerVideo.tsx`       | the PiP Pan Dude clip and its overlay controls         |
| `apps/web/components/EmperorCookieModal.tsx`      | the ALLOW/DISMISS dialog (no close-X)                  |
| `apps/web/components/home/HomeVideoHero.tsx`      | hero version — reuses `HeroLeader`                     |
| `apps/web/components/home/HeroLeader.tsx`         | shared 3-2-1 film-leader (compact variant for the widget) |
| `apps/web/lib/privacy/decision.ts`                | storage read/write, events, hooks                      |
| `apps/web/providers/AnalyticsProvider.tsx`        | PostHog-EU-on-allow, Umami-on-dismiss routing          |
