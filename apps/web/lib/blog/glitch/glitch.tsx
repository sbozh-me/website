"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { Censor } from "./censor";
import { cipher } from "./cipher";
import {
  type BurstKind,
  type Look,
  type Rng,
  holdMs,
  nextDelay,
  onlySlice,
  planBurst,
  randomKind,
  showsVeiled,
  showsVeiledHover,
  withoutSlices,
} from "./plan";
import { useGlitchesEnabled } from "./window";
import "./glitch.css";

/** On each DICK PITCH flip the ✳ spins pi turns and lands wherever pi leaves it. */
export const SPIN_TURNS = 3.14;

const VIEWPORT_MARGIN = 8;

/** A click stops a burst only after this long; a tap's pointerenter has just started it. */
const STOP_AFTER_MS = 300;

/** Colour names a state can pick with a `teal:` prefix. */
export const GLITCH_COLORS: Record<string, string> = {
  purple: "var(--glitch-base)",
  gold: "var(--glitch-accent)",
  teal: "var(--glitch-echo)",
  white: "var(--color-foreground)",
  red: "var(--glitch-red)",
  pink: "var(--glitch-pink)",
};

interface StateStyle {
  /** CSS colour of the state's text. */
  color: string;
  /** Article font and colour instead of the glitch weight; no resting notch. */
  plain: boolean;
  /** Is (or holds) a link: teal by default, big overhanging underline. */
  link: boolean;
}

interface EngineProps {
  count: number;
  renderState: (state: number) => ReactNode;
  /** Per-state colour and plainness; without it the CSS decides (DICK PITCH). */
  styles?: StateStyle[];
  /** Characters per state, for how long a flipped state is held. */
  lengths: number[];
  /** "return": bursts come back to state 0. "toggle": each burst moves to the next state. */
  mode: "return" | "toggle";
  blink?: boolean;
  /** The post starts with the window closed (`==WINDOW OFF==`). */
  windowOff?: boolean;
  /** `===a|b===`: keeps glitching whatever the window switch says. */
  unclosable?: boolean;
  /** `==|text==`: only there while the window is ON; gone when it's OFF. */
  windowOnly?: boolean;
  /** `==shut|>open==`: the state to rest on while the window is ON; state 0 is only for OFF. */
  openState?: number;
  /** Each state as plain text: the ones not at rest go to `data-alt` for machines reading the HTML. */
  texts?: string[];
  /**
   * Each state as the cipher face sets it (cipher.ts): with the window OFF the word keeps
   * glitching, into these shapes. The base is left out, it stays readable; any other state
   * left out shows as it is. Without the list the word stands still while the window is OFF.
   */
  ciphers?: Array<string | undefined>;
  className?: string;
  rng?: Rng;
}

/**
 * A window-OFF word is inline text, and the CSS centres its layers on it. A word that wraps
 * has no single box to centre on, so its layers go over the part on its first line.
 */
function coverFirstLine(root: HTMLElement, layers: HTMLElement) {
  const [first, ...more] = Array.from(root.getClientRects());
  if (more.length === 0) return;
  layers.style.inset = "0 auto auto 0";
  layers.style.width = `${first.width}px`;
  const box = layers.getBoundingClientRect();
  layers.style.left = `${first.left - box.left}px`;
  layers.style.top = `${first.top + first.height / 2 - (box.top + box.height / 2)}px`;
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Draws one state as layered copies (echoes, a main copy with strips cut out, and the
 * strips shifted sideways) and plays bursts: on scroll-in, at random while visible,
 * and on hover/tap. With reduced motion it stays on the resting state.
 */
function GlitchEngine({
  count,
  renderState,
  styles,
  lengths,
  mode,
  blink = false,
  windowOff = false,
  unclosable = false,
  windowOnly = false,
  openState,
  texts,
  ciphers,
  className,
  rng = Math.random,
}: EngineProps) {
  // The server (and the hydrating render) sends the word once, as plain text: crawlers and
  // AI readers get clean HTML. The decorative copies are drawn only in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rootRef = useRef<HTMLSpanElement>(null);
  const layersRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLSpanElement>(null);

  // The page's "window" switch: when it's off the word is plain article text
  const windowOpen = useGlitchesEnabled(windowOff);
  const on = windowOpen || unclosable;
  // Off, it still glitches, into shapes instead of its other meanings: there is context here,
  // and the window shows it. Now and then on its own (showsVeiled, plan.ts), and a tap can
  // still peek (showsVeiledHover). A hovered word calms, as a way to hold the shapes still
  // and read the base. A brand mark or a window-only word hides nothing and stands still.
  const veiled = !on && ciphers !== undefined && count > 1 && !windowOnly;
  // Where the word rests: state 0, or the `>` state while the window is open. An unclosable
  // `>` word keeps glitching with the window closed, but still rests on its base there.
  const restState = windowOpen && openState !== undefined ? openState : 0;

  const [state, setState] = useState(restState);
  const [look, setLook] = useState<Look | undefined>();
  const [flips, setFlips] = useState(0);

  // Latest props for the timer callbacks, which outlive renders
  const props = useRef({ count, lengths, mode, blink, rng, openState, windowOpen, veiled, ciphers });
  props.current = { count, lengths, mode, blink, rng, openState, windowOpen, veiled, ciphers };

  const engine = useRef({
    rest: restState,
    playing: false,
    /** When the running burst started: a tap's own pointerenter mustn't count as a stop click. */
    startedAt: 0,
    visible: false,
    seen: false,
    reduced: false,
    off: false,
    /** Pointer is over the word while veiled: keep it calm until the pointer leaves. */
    hovered: false,
    /** `on` as the engine last saw it: a burst is planned for the window as it is */
    on,
    stepTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    nextTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  function schedule() {
    const e = engine.current;
    clearTimeout(e.nextTimer);
    if (!e.visible || e.reduced || e.off || e.hovered) return;
    const { rng: random, blink: blinking, veiled: hidden } = props.current;
    e.nextTimer = setTimeout(() => {
      if (document.hidden) schedule();
      // Veiled, the shapes turn up half of the time, and always as a flip: a twitch of the
      // plain word would show none
      else if (hidden) showsVeiled(random) ? play("flip") : schedule();
      else play(randomKind(random, blinking));
    }, nextDelay(random, blinking, hidden));
  }

  function play(kind: Exclude<BurstKind, "toggle">) {
    const e = engine.current;
    // A burst already running reschedules when it ends
    if (e.playing || e.reduced || e.off) return;
    e.playing = true;
    e.startedAt = Date.now();

    const {
      count: states,
      lengths: chars,
      mode: m,
      blink: blinking,
      rng: random,
      openState: open,
      windowOpen: opened,
      veiled: hidden,
      ciphers: shapes,
    } = props.current;
    const burstKind: BurstKind = m === "toggle" && kind === "flip" ? "toggle" : kind;
    const burst = planBurst({
      kind: burstKind,
      from: e.rest,
      count: states,
      rng: random,
      // Shapes are glimpsed, not read: held as briefly as a blink
      hold: (s) => holdMs(chars[s] ?? 0, blinking || (hidden && shapes?.[s] !== undefined)),
      // A `>` word keeps its closed-window text out of the open window, and (unclosable)
      // its open-window state out of the closed one. Veiled, every state shows, as shapes.
      skip: hidden || open === undefined ? undefined : opened ? 0 : open,
    });
    if (burstKind === "toggle") setFlips((f) => f + 1);

    let index = 0;
    const step = () => {
      if (index === burst.steps.length) {
        // A `>` word may have had its rest moved by the window mid-burst
        if (props.current.openState === undefined) e.rest = burst.rest;
        e.playing = false;
        setState(e.rest);
        setLook(undefined);
        schedule();
        return;
      }
      const current = burst.steps[index++];
      setState(current.state);
      setLook(current.look);
      e.stepTimer = setTimeout(step, current.ms);
    };
    step();
  }

  /** A click on a running burst: snap back to the resting state now. */
  function stop() {
    const e = engine.current;
    clearTimeout(e.stepTimer);
    e.playing = false;
    setState(e.rest);
    setLook(undefined);
    schedule();
  }

  /**
   * A hover. Veiled, it calms the word: a running burst snaps back to the base and no auto
   * bursts start until the pointer leaves, so the base can be read without flicker. A tap
   * is still free to peek (onClick → tap). Otherwise a hover always plays.
   */
  function hover() {
    const e = engine.current;
    if (props.current.veiled) {
      if (e.hovered) return;
      e.hovered = true;
      clearTimeout(e.stepTimer);
      clearTimeout(e.nextTimer);
      e.playing = false;
      setState(e.rest);
      setLook(undefined);
      return;
    }
    play("flip");
  }

  /** The pointer leaves: a veiled word resumes its auto-bursts. */
  function leave() {
    const e = engine.current;
    if (!e.hovered) return;
    e.hovered = false;
    if (!e.playing) schedule();
  }

  /**
   * A tap. Veiled, the shapes come up 73 times in 111, rolled fresh each time: coming to
   * the same word again is a new roll, never a settled yes or no. Otherwise it always plays.
   */
  function tap() {
    if (props.current.veiled && !showsVeiledHover(props.current.rng)) return;
    play("flip");
  }

  function onClick() {
    const e = engine.current;
    // Toggle bursts (D✳CK PITCH) change the word, so they always run to the end
    if (e.playing && props.current.mode === "return" && Date.now() - e.startedAt > STOP_AFTER_MS) stop();
    else tap();
  }

  useEffect(() => {
    const e = engine.current;
    const el = rootRef.current;
    e.reduced = prefersReducedMotion();
    if (e.reduced || !el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        e.visible = entry.isIntersecting;
        if (!entry.isIntersecting) {
          clearTimeout(e.nextTimer);
        } else if (!e.seen && !props.current.veiled) {
          e.seen = true;
          play("flip");
        } else if (!e.playing) {
          schedule();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(e.stepTimer);
      clearTimeout(e.nextTimer);
      e.playing = false;
    };
    // play/schedule only read refs; the engine starts once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const e = engine.current;
    // An unclosable word stays on through a window switch, and its burst plays on. Any other
    // burst was planned for the window as it was (readable, or in shapes): it is cut.
    const playsOn = on && e.on;
    e.on = on;
    e.off = !on && !veiled;
    // A `>` word swaps its resting state with the window
    if (openState !== undefined) e.rest = restState;
    if (!playsOn) {
      clearTimeout(e.stepTimer);
      clearTimeout(e.nextTimer);
      e.playing = false;
      setLook(undefined);
    }
    if (e.playing) return;
    setState(e.rest);
    schedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, veiled, restState]);

  // Keep a wider alt state inside the viewport
  useLayoutEffect(() => {
    const root = rootRef.current;
    const layers = layersRef.current;
    const main = mainRef.current;
    if (!root || !layers || !main) return;
    if (!on) coverFirstLine(root, layers);
    layers.style.setProperty("--glitch-shift", "0px");
    const { left, right } = main.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    if (!width || right - left > width - 2 * VIEWPORT_MARGIN) return;
    let shift = 0;
    if (left < VIEWPORT_MARGIN) shift = VIEWPORT_MARGIN - left;
    else if (right > width - VIEWPORT_MARGIN) shift = width - VIEWPORT_MARGIN - right;
    if (shift) layers.style.setProperty("--glitch-shift", `${Math.round(shift)}px`);
  }, [state, look, mounted, on]);

  // Veiled, a copy keeps the article's face (the shapes bring their own) and its state's colour
  const shown: StateStyle | undefined = veiled
    ? { color: (state > 0 && styles?.[state]?.color) || "var(--glitch-plain)", plain: true, link: false }
    : styles?.[state];
  const shapes = veiled ? ciphers?.[state] : undefined;
  // A glitch word sits still and legible at rest; only a burst slices it.
  const resting: Look = { tone: "rest", scale: 1, dx: 0, dy: 0, echo: null, slices: [] };
  // Window OFF the shapes just flicker in and out: no slices, echoes or jumps to smear them
  // (the 4-Sided face is unreadable enough), so a veiled burst keeps the resting look.
  const current = veiled ? resting : (look ?? resting);
  const move = (x: number, y: number): CSSProperties => ({
    transform: `translate(calc(-50% + var(--glitch-shift, 0px) + ${x}px), ${y}px) scale(${current.scale})`,
    ...(shown &&
      ({
        "--glitch-color": shown.color,
        "--glitch-flash": shown.color === GLITCH_COLORS.gold ? GLITCH_COLORS.purple : GLITCH_COLORS.gold,
      } as CSSProperties)),
  });
  const plain = (style?: StateStyle) => (style?.plain ? "" : undefined);
  // red: states get their own face (--glitch-font-red)
  const red = (style?: StateStyle) => (style?.color === GLITCH_COLORS.red ? "" : undefined);
  const link = shown?.link ? "" : undefined;
  const content = shapes === undefined ? renderState(state) : <span className="glitch-cipher">{shapes}</span>;
  // A held alt is often wider than the base word: back it so it covers the neighbours cleanly
  const cover = mode === "return" && state !== restState && !look ? "" : undefined;
  const alt = texts?.filter((text, index) => index !== restState && text).join(" | ");

  // translate="no" (+ notranslate for older Google Translate): a page translator swaps text nodes
  // for its own <font> wrappers, and React, which keeps swapping these layers, then throws on
  // removeChild/insertBefore and takes the page down. The word stays as written instead.
  return (
    <span
      ref={rootRef}
      translate="no"
      className={["glitch", "notranslate", className].filter(Boolean).join(" ")}
      data-bursting={look ? "" : undefined}
      data-off={on ? undefined : ""}
      data-alt={alt || undefined}
      style={{ "--censor-turns": flips * SPIN_TURNS } as CSSProperties}
      onPointerEnter={hover}
      onPointerLeave={leave}
      onClick={onClick}
    >
      {/* The root stays mounted either way so its IntersectionObserver keeps working */}
      {renderWord()}
    </span>
  );

  function renderWord() {
    if (on) return mounted ? renderLayers() : renderCalm();
    if (windowOnly) return null;
    if (veiled) return renderVeiled();
    // Nothing to hide (a brand mark, a word that is the Window button): it stands still
    return renderState(mode === "toggle" ? state : 0);
  }

  /** Window OFF: the word as article text, in the flow; a burst is drawn over it while it plays. */
  function renderVeiled() {
    const playing = look !== undefined || state !== restState;
    return (
      <>
        <span className="glitch-rest" data-covered={playing ? "" : undefined}>
          {renderState(restState)}
        </span>
        {playing && renderCopies()}
      </>
    );
  }

  /** Before hydration: the resting word, once, in its colour; no copies in the HTML. */
  function renderCalm() {
    const rest = styles?.[restState];
    return (
      <span
        className="glitch-sizer"
        data-calm=""
        data-plain={plain(rest)}
        data-red={red(rest)}
        style={rest && { color: rest.color }}
      >
        {renderState(restState)}
      </span>
    );
  }

  function renderLayers() {
    return (
      <>
        {/* Real text: keeps the layout, selection and screen readers on the base state */}
        <span className="glitch-sizer" data-plain={plain(styles?.[restState])} data-red={red(styles?.[restState])}>
          {renderState(restState)}
        </span>
        {renderCopies()}
      </>
    );
  }

  /** Decoration only: hidden from screen readers and kept out of search snippets. */
  function renderCopies() {
    return (
      <span ref={layersRef} className="glitch-layers" aria-hidden="true" data-nosnippet="">
        {/* The theme's background under every copy; a `||` state at rest is just article text */}
        {(!shown?.plain || look || cover !== undefined) && (
          <span
            className="glitch-back"
            data-plain={plain(shown)}
            data-red={red(shown)}
            data-bursting={look ? "" : undefined}
            data-cover={cover}
            style={move(current.dx, current.dy)}
          >
            {content}
          </span>
        )}
        {current.echo !== null && (
          <>
            <span
              className="glitch-copy glitch-echo"
              data-plain={plain(shown)}
              data-red={red(shown)}
              data-link={link}
              style={move(current.dx + current.echo, current.dy + 2)}
            >
              {content}
            </span>
            <span
              className="glitch-copy glitch-echo glitch-echo-dark"
              data-plain={plain(shown)}
              data-red={red(shown)}
              data-link={link}
              style={move(current.dx - Math.trunc(current.echo / 2), current.dy + 3)}
            >
              {content}
            </span>
          </>
        )}
        <span
          ref={mainRef}
          key="main"
          className="glitch-copy"
          data-tone={current.tone}
          data-plain={plain(shown)}
          data-red={red(shown)}
          data-link={link}
          data-cover={cover}
          style={{ ...move(current.dx, current.dy), clipPath: withoutSlices(current.slices) }}
        >
          {content}
        </span>
        {current.slices.map((slice, index) => (
          <span
            key={index}
            className="glitch-copy"
            data-tone={current.tone}
            data-plain={plain(shown)}
            data-red={red(shown)}
            data-link={link}
            data-cover={cover}
            style={{ ...move(current.dx + slice.dx, current.dy), clipPath: onlySlice(slice) }}
          >
            {content}
          </span>
        ))}
      </span>
    );
  }
}

/** A window-button state is held like a 30-character word (~2s), so it can be clicked. */
const WINDOW_STATE_LENGTH = 30;

function isWindowState(state: ReactNode): boolean {
  return isValidElement<GlitchStateProps>(state) && Boolean(state.props.window);
}

function stateLength(state: ReactNode): number {
  return isWindowState(state) ? WINDOW_STATE_LENGTH : textLength(state);
}

/** A state as plain text: the ✳ for a censor, nothing for a Window button. */
export function plainState(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainState).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (node.type === Censor) return "✳";
    return plainState(node.props.children);
  }
  return "";
}

function textLength(node: ReactNode): number {
  if (typeof node === "string" || typeof node === "number") return String(node).length;
  if (Array.isArray(node)) return node.reduce((sum: number, child) => sum + textLength(child), 0);
  if (isValidElement<{ children?: ReactNode }>(node)) return textLength(node.props.children) || 1;
  return 0;
}

interface GlitchStateProps {
  children?: ReactNode;
  /** gold | purple | teal | white | red | pink; defaults to purple for the base, gold for the rest. */
  color?: string;
  /** Shown in the article's own font and colour (`||` in the syntax). */
  plain?: boolean;
  /** Is a link or holds one. */
  link?: boolean;
  /** Holds the window button (`==a|WINDOW==`): held long enough to click. */
  window?: boolean;
}

/** One meaning of a glitch word; `==base|alt==` makes two. */
export function GlitchState({ children }: GlitchStateProps) {
  return <>{children}</>;
}

function stateStyle(state: ReactNode, index: number): StateStyle {
  const { color, plain = false, link = false } = isValidElement<GlitchStateProps>(state) ? state.props : {};
  const fallback = link
    ? GLITCH_COLORS.teal
    : plain
      ? "var(--glitch-plain)"
      : index === 0
        ? GLITCH_COLORS.purple
        : GLITCH_COLORS.gold;
  return { color: (color && GLITCH_COLORS[color]) || fallback, plain, link };
}

/** A word that glitches into its other meanings and back: `==себя|US==`, `==a|b|c==`. */
export function Glitch({
  children,
  blink = false,
  windowOff = false,
  unclosable = false,
  windowOnly = false,
  openState,
  rng,
}: {
  children?: ReactNode;
  blink?: boolean;
  windowOff?: boolean;
  unclosable?: boolean;
  windowOnly?: boolean;
  /** From remark-glitch as a string: `==shut|>open==` gives "1". */
  openState?: number | string;
  rng?: Rng;
}) {
  const states = Children.toArray(children);
  if (states.length === 0) return null;
  const open = openState === undefined ? undefined : Number(openState);
  const validOpen = open !== undefined && Number.isInteger(open) && open > 0 && open < states.length ? open : undefined;
  const texts = states.map((state) => plainState(state).replace(/\s+/g, " ").trim());
  // Window OFF: every meaning but the base is set in shapes. A Window button stays a button,
  // and a word whose base is one (`==WINDOW OFF|>…==`) stands still, to be pressed.
  const ciphers = isWindowState(states[0])
    ? undefined
    : states.map((state, index) => (index === 0 || isWindowState(state) ? undefined : cipher(texts[index])));

  return (
    <GlitchEngine
      count={states.length}
      renderState={(index) => states[index]}
      styles={states.map(stateStyle)}
      lengths={states.map(stateLength)}
      texts={texts}
      ciphers={ciphers}
      mode="return"
      blink={blink}
      windowOff={windowOff}
      unclosable={unclosable}
      windowOnly={windowOnly}
      openState={validOpen}
      rng={rng}
    />
  );
}

function Brand({ flipped }: { flipped: boolean }) {
  return (
    <>
      <span data-part={flipped ? "accent" : "base"}>
        D<Censor />
        CK
      </span>{" "}
      <span data-part={flipped ? "base" : "accent"}>PITCH</span>
    </>
  );
}

/** D✳CK PITCH brand mark: each burst swaps its two colours and spins the ✳. */
export function DickPitch({
  windowOff = false,
  unclosable = false,
  rng,
}: {
  windowOff?: boolean;
  unclosable?: boolean;
  rng?: Rng;
}) {
  return (
    <GlitchEngine
      count={2}
      renderState={(state) => <Brand flipped={state === 1} />}
      lengths={[10, 10]}
      mode="toggle"
      windowOff={windowOff}
      unclosable={unclosable}
      className="brand-mark dick-pitch"
      rng={rng}
    />
  );
}

/** "sbozh" then the rest ("ed"), in the case it was typed: sbozhed, Sbozhed, SBOZHED. */
function SbozhedMark({ text, flipped }: { text: string; flipped: boolean }) {
  return (
    <>
      <span data-part={flipped ? "accent" : "base"}>{text.slice(0, 5)}</span>
      <span data-part={flipped ? "base" : "accent"}>{text.slice(5)}</span>
    </>
  );
}

/** `==sbozhed==` brand mark: "sbozh" purple, "ed" orange; each burst swaps the two colours. */
export function Sbozhed({
  text = "sbozhed",
  windowOff = false,
  unclosable = false,
  rng,
}: {
  /** As typed in the post; remark-glitch passes it through. */
  text?: string;
  windowOff?: boolean;
  unclosable?: boolean;
  rng?: Rng;
}) {
  return (
    <GlitchEngine
      count={2}
      renderState={(state) => <SbozhedMark text={text} flipped={state === 1} />}
      lengths={[text.length, text.length]}
      mode="toggle"
      windowOff={windowOff}
      unclosable={unclosable}
      className="brand-mark sbozhed"
      rng={rng}
    />
  );
}
