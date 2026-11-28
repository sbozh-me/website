"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { GLITCH_COLORS } from "./glitch";
import {
  type AvatarLook,
  type AvatarMoves,
  type AvatarTint,
  type Rng,
  REST_PHOTO,
  nextAvatarDelay,
  onlySlice,
  planAvatarBurst,
  withoutSlices,
} from "./plan";
import { useGlitchesEnabled } from "./window";
import "./glitch.css";

/** A click stops a burst only after this long; a tap's pointerenter has just started it. */
const STOP_AFTER_MS = 300;

interface GlitchAvatarProps {
  /** The resting photo, drawn by `children`; a burst glitches it too. */
  rest: string;
  /** Photos a burst flashes through. None: it glitches the resting photo itself. */
  photos: string[];
  /** What else every burst frame does to the photo at random: turn, mirror, scale. */
  moves?: AvatarMoves;
  /** The resting photo itself (an <Image>), always in the page. */
  children: ReactNode;
  /** Stands still: a hidden copy that is only measured. */
  still?: boolean;
  rng?: Rng;
}

function prefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** One painted copy of a photo; a tinted copy is greyed and painted in a glitch colour (CSS). */
function Photo({
  src,
  tint,
  className,
  style,
}: {
  src: string;
  tint?: AvatarTint | null;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={className}
      data-tint={tint ?? undefined}
      style={
        {
          "--avatar-photo": `url("${src}")`,
          ...(tint && { "--avatar-tint": GLITCH_COLORS[tint] }),
          ...style,
        } as CSSProperties
      }
    />
  );
}

/**
 * An avatar that glitches while the page's window is open (button or W key): at random
 * while on screen, when it scrolls in, when the window opens, and on hover/tap. A burst
 * flashes through `photos`, each painted in one of the glitch colours, cut into shifted
 * strips with a coloured echo, and settles back on the resting photo. Without `photos` it
 * does all that to the resting photo; `moves` also turn, mirror or scale every frame at
 * random. With the window OFF, or with reduced motion, it's the resting photo and nothing else.
 */
export function GlitchAvatar({
  rest,
  photos,
  moves = {},
  children,
  still = false,
  rng = Math.random,
}: GlitchAvatarProps) {
  const open = useGlitchesEnabled();
  const on = open && !still;
  const [look, setLook] = useState<AvatarLook | undefined>();
  const rootRef = useRef<HTMLSpanElement>(null);

  // Latest props for the timer callbacks, which outlive renders
  const props = useRef({ photos, moves, rng });
  props.current = { photos, moves, rng };

  const engine = useRef({
    playing: false,
    startedAt: 0,
    visible: false,
    seen: false,
    reduced: false,
    on: false,
    stepTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    nextTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  function schedule() {
    const e = engine.current;
    clearTimeout(e.nextTimer);
    if (!e.visible || e.reduced || !e.on) return;
    const random = props.current.rng;
    e.nextTimer = setTimeout(() => {
      if (document.hidden) schedule();
      else play(random() < 0.6 ? "flip" : "twitch");
    }, nextAvatarDelay(random));
  }

  function play(kind: "flip" | "twitch") {
    const e = engine.current;
    if (e.playing || e.reduced || !e.on) return;
    e.playing = true;
    e.startedAt = Date.now();
    const { photos: shots, moves: moving, rng: random } = props.current;
    const steps = planAvatarBurst({ kind, photos: shots.length, moves: moving, rng: random });

    let index = 0;
    const step = () => {
      if (index === steps.length) {
        e.playing = false;
        setLook(undefined);
        schedule();
        return;
      }
      const current = steps[index++];
      setLook(current.look);
      e.stepTimer = setTimeout(step, current.ms);
    };
    step();
  }

  function stop() {
    const e = engine.current;
    clearTimeout(e.stepTimer);
    e.playing = false;
    setLook(undefined);
    schedule();
  }

  function onClick() {
    const e = engine.current;
    if (e.playing && Date.now() - e.startedAt > STOP_AFTER_MS) stop();
    else play("flip");
  }

  useEffect(() => {
    const e = engine.current;
    const el = rootRef.current;
    e.reduced = prefersReducedMotion();
    if (still || e.reduced || !el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        e.visible = entry.isIntersecting;
        if (!entry.isIntersecting) {
          clearTimeout(e.nextTimer);
        } else if (!e.seen && e.on) {
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
  }, [still]);

  useEffect(() => {
    const e = engine.current;
    const opened = on && !e.on;
    e.on = on;
    clearTimeout(e.stepTimer);
    clearTimeout(e.nextTimer);
    e.playing = false;
    setLook(undefined);
    if (!on) return;
    // Bring the photos in before the first burst needs them
    for (const src of props.current.photos) new window.Image().src = src;
    // Opening the window on a visible avatar shows what it does right away
    if (opened && e.visible) {
      e.seen = true;
      play("flip");
    } else schedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const src = look && (look.photo === REST_PHOTO ? rest : photos[look.photo]);
  const tint = look?.tint;
  const move =
    look &&
    `translate(${look.dx}px, ${look.dy}px) rotate(${look.rotate}deg) ` +
      `scale(${look.mirrorX ? -look.scale : look.scale}, ${look.mirrorY ? -look.scale : look.scale})`;

  return (
    <span
      ref={rootRef}
      className="glitch-avatar"
      data-window={on ? "on" : "off"}
      data-playing={look ? "" : undefined}
      onPointerEnter={on ? () => play("flip") : undefined}
      onClick={on ? onClick : undefined}
    >
      {children}
      {look && src && (
        <span className="glitch-avatar-layers" aria-hidden="true">
          <Photo
            src={src}
            tint={tint}
            className="glitch-avatar-photo"
            style={{ transform: move, clipPath: withoutSlices(look.slices) }}
          />
          {look.slices.map((slice, i) => (
            <Photo
              key={i}
              src={src}
              tint={tint}
              className="glitch-avatar-photo"
              style={{ transform: `translateX(${slice.dx}px) ${move}`, clipPath: onlySlice(slice) }}
            />
          ))}
          {look.echo && (
            <Photo
              src={src}
              tint={look.echo.tint}
              className="glitch-avatar-photo glitch-avatar-echo"
              style={{ transform: `translateX(${look.echo.dx}px) ${move}` }}
            />
          )}
        </span>
      )}
    </span>
  );
}
