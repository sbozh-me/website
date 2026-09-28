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
  className,
  rng = Math.random,
}: EngineProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const layersRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLSpanElement>(null);

  const [state, setState] = useState(0);
  const [look, setLook] = useState<Look | undefined>();
  const [restSlices, setRestSlices] = useState<Slice[]>([]);
  const [flips, setFlips] = useState(0);
  // The page's "window" switch: when it's off the word is plain text and never bursts
  const on = useGlitchesEnabled(windowOff);

  // Latest props for the timer callbacks, which outlive renders
  const props = useRef({ count, lengths, mode, blink, rng });
  props.current = { count, lengths, mode, blink, rng };

  const engine = useRef({
    rest: 0,
    playing: false,
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

    const { count: states, lengths: chars, mode: m, blink: blinking, rng: random } = props.current;
    const burstKind: BurstKind = m === "toggle" && kind === "flip" ? "toggle" : kind;
    const burst = planBurst({
      kind: burstKind,
      from: e.rest,
      count: states,
      rng: random,
      hold: (s) => holdMs(chars[s] ?? 0, blinking),
    });
    if (burstKind === "toggle") setFlips((f) => f + 1);

    let index = 0;
    const step = () => {
      if (index === burst.steps.length) {
        e.rest = burst.rest;
        e.playing = false;
        setState(burst.rest);
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
    if (on) {
      if (!e.playing) schedule();
      return;
    }
    clearTimeout(e.stepTimer);
    clearTimeout(e.nextTimer);
    e.playing = false;
    setState(e.rest);
    setLook(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

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
  const link = shown?.link ? "" : undefined;
  const content = renderState(state);
  // A held alt is often wider than the base word: back it so it covers the neighbours cleanly
  const cover = mode === "return" && state !== 0 && !look ? "" : undefined;

  return (
    <span
      ref={rootRef}
      className={["glitch", className].filter(Boolean).join(" ")}
      data-bursting={look ? "" : undefined}
      data-off={on ? undefined : ""}
      style={{ "--censor-turns": flips * SPIN_TURNS } as CSSProperties}
      onPointerEnter={() => play("flip")}
      onClick={() => play("flip")}
    >
      {/* The root stays mounted either way so its IntersectionObserver keeps working */}
      {on ? renderLayers() : renderState(mode === "toggle" ? state : 0)}
    </span>
  );

  function renderLayers() {
    return (
      <>
        {/* Real text: keeps the layout, selection and screen readers on the base state */}
        <span className="glitch-sizer" data-plain={plain(styles?.[0])}>
          {renderState(0)}
        </span>
        <span ref={layersRef} className="glitch-layers" aria-hidden="true">
          {current.echo !== null && (
            <>
              <span
                className="glitch-copy glitch-echo"
                data-plain={plain(shown)}
                data-link={link}
                style={move(current.dx + current.echo, current.dy + 2)}
              >
                {content}
              </span>
              <span
                className="glitch-copy glitch-echo glitch-echo-dark"
                data-plain={plain(shown)}
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
  rng,
}: {
  children?: ReactNode;
  blink?: boolean;
  windowOff?: boolean;
  rng?: Rng;
}) {
  const states = Children.toArray(children);
  if (states.length === 0) return null;

  return (
    <GlitchEngine
      count={states.length}
      renderState={(index) => states[index]}
      styles={states.map(stateStyle)}
      lengths={states.map(textLength)}
      mode="return"
      blink={blink}
      windowOff={windowOff}
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
export function DickPitch({ windowOff = false, rng }: { windowOff?: boolean; rng?: Rng }) {
  return (
    <GlitchEngine
      count={2}
      renderState={(state) => <Brand flipped={state === 1} />}
      lengths={[10, 10]}
      mode="toggle"
      windowOff={windowOff}
      className="dick-pitch"
      rng={rng}
    />
  );
}
