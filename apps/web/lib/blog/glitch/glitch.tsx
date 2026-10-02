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
import {
  type BurstKind,
  type Look,
  type Rng,
  type Slice,
  holdMs,
  nextDelay,
  notches,
  onlySlice,
  planBurst,
  randomKind,
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
  className?: string;
  rng?: Rng;
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
  className,
  rng = Math.random,
}: EngineProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const layersRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLSpanElement>(null);

  // The page's "window" switch: when it's off the word is plain text and never bursts
  const windowOpen = useGlitchesEnabled(windowOff);
  const on = windowOpen || unclosable;
  // Where the word rests: state 0, or the `>` state while the window is open. An unclosable
  // `>` word keeps glitching with the window closed, but still rests on its base there.
  const restState = windowOpen && openState !== undefined ? openState : 0;

  const [state, setState] = useState(restState);
  const [look, setLook] = useState<Look | undefined>();
  const [restSlices, setRestSlices] = useState<Slice[]>([]);
  const [flips, setFlips] = useState(0);

  // Latest props for the timer callbacks, which outlive renders
  const props = useRef({ count, lengths, mode, blink, rng, openState, windowOpen });
  props.current = { count, lengths, mode, blink, rng, openState, windowOpen };

  const engine = useRef({
    rest: restState,
    playing: false,
    /** When the running burst started: a tap's own pointerenter mustn't count as a stop click. */
    startedAt: 0,
    visible: false,
    seen: false,
    reduced: false,
    off: false,
    stepTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    nextTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  function schedule() {
    const e = engine.current;
    clearTimeout(e.nextTimer);
    if (!e.visible || e.reduced || e.off) return;
    const { rng: random, blink: blinking } = props.current;
    e.nextTimer = setTimeout(() => {
      if (document.hidden) schedule();
      else play(randomKind(random, blinking));
    }, nextDelay(random, blinking));
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
    } = props.current;
    const burstKind: BurstKind = m === "toggle" && kind === "flip" ? "toggle" : kind;
    const burst = planBurst({
      kind: burstKind,
      from: e.rest,
      count: states,
      rng: random,
      hold: (s) => holdMs(chars[s] ?? 0, blinking),
      // A `>` word keeps its closed-window text out of the open window, and (unclosable)
      // its open-window state out of the closed one
      skip: open === undefined ? undefined : opened ? 0 : open,
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

  function onClick() {
    const e = engine.current;
    // Toggle bursts (D✳CK PITCH) change the word, so they always run to the end
    if (e.playing && props.current.mode === "return" && Date.now() - e.startedAt > STOP_AFTER_MS) stop();
    else play("flip");
  }

  useEffect(() => {
    const e = engine.current;
    const el = rootRef.current;
    e.reduced = prefersReducedMotion();
    setRestSlices(notches(props.current.rng));
    if (e.reduced || !el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        e.visible = entry.isIntersecting;
        if (!entry.isIntersecting) {
          clearTimeout(e.nextTimer);
        } else if (!e.seen) {
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
    e.off = !on;
    // A `>` word swaps its resting state with the window
    if (openState !== undefined) e.rest = restState;
    if (on) {
      if (openState !== undefined && !e.playing) setState(restState);
      if (!e.playing) schedule();
      return;
    }
    clearTimeout(e.stepTimer);
    clearTimeout(e.nextTimer);
    e.playing = false;
    setState(e.rest);
    setLook(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, restState]);

  // Keep a wider alt state inside the viewport
  useLayoutEffect(() => {
    const layers = layersRef.current;
    const main = mainRef.current;
    if (!layers || !main) return;
    layers.style.setProperty("--glitch-shift", "0px");
    const { left, right } = main.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    if (!width || right - left > width - 2 * VIEWPORT_MARGIN) return;
    let shift = 0;
    if (left < VIEWPORT_MARGIN) shift = VIEWPORT_MARGIN - left;
    else if (right > width - VIEWPORT_MARGIN) shift = width - VIEWPORT_MARGIN - right;
    if (shift) layers.style.setProperty("--glitch-shift", `${Math.round(shift)}px`);
  }, [state, look]);

  const shown = styles?.[state];
  const current = look ?? {
    tone: "rest",
    scale: 1,
    dx: 0,
    dy: 0,
    echo: null,
    // A plain state reads as article text, so it rests without the notch
    slices: shown?.plain ? [] : restSlices,
  };
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
  const content = renderState(state);
  // A held alt is often wider than the base word: back it so it covers the neighbours cleanly
  const cover = mode === "return" && state !== restState && !look ? "" : undefined;

  return (
    <span
      ref={rootRef}
      className={["glitch", className].filter(Boolean).join(" ")}
      data-bursting={look ? "" : undefined}
      data-off={on ? undefined : ""}
      style={{ "--censor-turns": flips * SPIN_TURNS } as CSSProperties}
      onPointerEnter={() => play("flip")}
      onClick={onClick}
    >
      {/* The root stays mounted either way so its IntersectionObserver keeps working */}
      {on ? renderLayers() : windowOnly ? null : renderState(mode === "toggle" ? state : 0)}
    </span>
  );

  function renderLayers() {
    return (
      <>
        {/* Real text: keeps the layout, selection and screen readers on the base state */}
        <span className="glitch-sizer" data-plain={plain(styles?.[restState])} data-red={red(styles?.[restState])}>
          {renderState(restState)}
        </span>
        <span ref={layersRef} className="glitch-layers" aria-hidden="true">
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
      </>
    );
  }
}

/** A window-button state is held like a 30-character word (~2s), so it can be clicked. */
const WINDOW_STATE_LENGTH = 30;

function stateLength(state: ReactNode): number {
  if (isValidElement<GlitchStateProps>(state) && state.props.window) return WINDOW_STATE_LENGTH;
  return textLength(state);
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

  return (
    <GlitchEngine
      count={states.length}
      renderState={(index) => states[index]}
      styles={states.map(stateStyle)}
      lengths={states.map(stateLength)}
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
