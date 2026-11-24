"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useLeaderAudio } from "./leader-audio"

/** The leader counts down from here, one turn of the hand per number */
export const LEADER_FROM = 3
export const LEADER_TICK_MS = 1000

// The dial, in the units of its 200x200 view box
const CENTRE = 100
const DIAL_R = 90
// The brand mark, while the video loads
const MARK_PX = 64

/**
 * Milliseconds until the hand is back at 12 o'clock, where the count moves on. The hand's own
 * animation is the clock: it has been turning since first paint, before this code loaded, and
 * it stands still while the visitor is scrolled away. Nothing to read (reduced motion keeps
 * the hand still): a full tick.
 */
function untilNextTurn(hand: SVGElement | null): number {
  const turn = hand?.getAnimations?.()[0]
  const at = turn && turn.playState !== "finished" ? Number(turn.currentTime) : 0
  return LEADER_TICK_MS - (at % LEADER_TICK_MS)
}

interface HeroLeaderProps {
  /** The video was asked to play and its picture isn't moving yet */
  loading: boolean
  /** The countdown has run out: the video may play */
  onDone: () => void
  /** Small picture-in-picture variant: the SVG fills its container, no viewport sizing */
  compact?: boolean
  /** External pause (visitor pressed the Pause button); stacks with scroll-away/hidden */
  paused?: boolean
  /** When false, the leader plays its countdown audio: a sync-pop beep on each digit
   *  and a projector ambience (motor hum, filtered noise, sprocket ticks) underneath */
  muted?: boolean
}

/**
 * The film leader over the home video, as on old black-and-white reels: a grey, grainy,
 * flickering frame with 3, 2, 1 in a dial, a clock hand going round once per number and
 * darkening the part it has swept. It is drawn, not a file, so it shows at first paint and
 * the video has the connection to itself while it counts.
 *
 * The count waits while the visitor is scrolled away from the top, even slightly, and goes on
 * from where the hand stood when they come back.
 *
 * If the video still can't play when the leader runs out (or stalls later), the brand mark
 * spins fast in the dial's place until the picture moves.
 */
export function HeroLeader({ loading, onDone, compact = false, paused: externallyPaused = false, muted = true }: HeroLeaderProps) {
  const [count, setCount] = useState(LEADER_FROM)
  const counting = count > 0
  // Fading out, it keeps its last number
  const shown = Math.max(count, 1)
  const hand = useRef<SVGLineElement>(null)
  // Scrolled away from the top: the film stands still until the visitor is back
  const [away, setAway] = useState(false)
  // Tab is hidden: the film stands still too, so the count doesn't run out off-screen
  const [hidden, setHidden] = useState(false)
  const paused = away || hidden || externallyPaused
  // Beeps and projector ambience only while the count is actively running
  useLeaderAudio({ enabled: !muted && counting && !paused, count })
  // Tracks the client takeover: before mount, the SSR'd number sits there with its hand
  // sweeping; we don't want the visitor to see the same "3" lingering for several turns
  // while hydration catches up or the video asset parses, so we fade the dial out and
  // show the colourful brand mark instead, until the client's timer picks up the count.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // The mark takes over the view whenever the dial can't move the count forward: the
  // client hasn't taken over yet, or the video has stalled (loading).
  const showMark = loading || !mounted

  useEffect(() => {
    if (!counting) return
    const update = () => setAway(window.scrollY > 0)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [counting])

  useEffect(() => {
    const update = () => setHidden(document.hidden)
    update()
    document.addEventListener("visibilitychange", update)
    return () => document.removeEventListener("visibilitychange", update)
  }, [])

  useEffect(() => {
    if (!counting) {
      onDone()
      return
    }
    if (paused) return
    const timer = setTimeout(() => setCount((n) => n - 1), untilNextTurn(hand.current))
    return () => clearTimeout(timer)
  }, [count, counting, paused, onDone])

  // The first number's hand keeps going round until the client takes over
  const turn = {
    animationDuration: `${LEADER_TICK_MS}ms`,
    animationIterationCount: shown === LEADER_FROM ? "infinite" : 1,
  }
  // The digit fades over its own tick. Each number remounts the text (key below),
  // so the animation starts fresh for 3, 2 and 1; before the client has taken over
  // there is no class and the number stays visible.
  const digitFade = mounted ? { animationDuration: `${LEADER_TICK_MS}ms` } : undefined

  return (
    <>
      {/* Without scripts nothing would ever end the leader, or bring the colour back */}
      <noscript>
        <style>{"[data-leader]{display:none}html{filter:none!important}"}</style>
      </noscript>
      <div
        aria-hidden="true"
        data-leader={counting ? "counting" : "done"}
        data-paused={paused && counting ? "" : undefined}
        // Counting, it takes the clicks: the video under it isn't to be started early.
        // A click on the countdown skips the rest of it -- setCount(0) flips the
        // internal counting guard, which runs the same onDone path the natural end does.
        onClick={counting ? () => setCount(0) : undefined}
        className={`leader-film absolute inset-0 grid place-items-center overflow-hidden transition-opacity duration-500 ${
          counting ? "cursor-pointer opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg
          viewBox="0 0 200 200"
          data-leader-dial
          className={`leader-weave overflow-visible transition-opacity duration-500 ${
            compact ? "h-24 w-24" : "w-[min(60vw,46svh)] max-w-80"
          } ${showMark ? "opacity-0" : "opacity-100"}`}
        >
          {/* A new number starts the turn again */}
          <g key={shown}>
            {/* A stroke as wide as the dial's radius, on a circle of half that radius, paints
                a pie: its dash grows from 12 o'clock, clockwise */}
            <circle
              className="leader-wipe"
              style={turn}
              cx={CENTRE}
              cy={CENTRE}
              r={DIAL_R / 2}
              fill="none"
              stroke="#000"
              strokeOpacity={0.3}
              strokeWidth={DIAL_R}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              transform={`rotate(-90 ${CENTRE} ${CENTRE})`}
            />
            <line
              ref={hand}
              className="leader-hand"
              style={turn}
              x1={CENTRE}
              y1={CENTRE}
              x2={CENTRE}
              y2={CENTRE - DIAL_R}
              stroke="currentColor"
              strokeWidth={3}
            />
          </g>
          {/* Crosshair across the frame, and the two white rings */}
          <path d="M-400 100H600M100 -400V600" stroke="currentColor" strokeWidth={1.5} />
          <circle cx={CENTRE} cy={CENTRE} r={DIAL_R} fill="none" stroke="#f4f4f4" strokeWidth={3} />
          <circle cx={CENTRE} cy={CENTRE} r={DIAL_R - 13} fill="none" stroke="#f4f4f4" strokeWidth={2} />
          <text
            key={`digit-${shown}`}
            data-leader-count
            className={mounted ? "leader-digit" : undefined}
            style={digitFade}
            x={CENTRE}
            y={CENTRE}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={112}
            fontWeight={700}
            fill="currentColor"
          >
            {shown}
          </text>
        </svg>
        {/* Old stock: grain, a scratch now and then, an unsteady lamp (globals.css) */}
        <div className="leader-grain" />
        <div className="leader-scratch" />
        <div className="leader-flicker" />
      </div>

      {/* The colour mark takes the dial's place while the video is loading or the
          client hasn't taken over yet: spin mid-level, fade in, fade out. Lives
          outside .leader-film so a post-count loading state still shows it, and
          so the film's data-paused freeze doesn't stop the spin. */}
      <div
        {...(showMark
          ? { role: "status" as const, "aria-label": "Loading video" }
          : { "aria-hidden": "true" as const })}
        data-leader-mark={showMark ? "" : undefined}
        className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500 ${
          showMark ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="rounded-full bg-background/40 p-4 backdrop-blur-md">
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={MARK_PX}
            height={MARK_PX}
            className="leader-mark block"
          />
        </span>
      </div>
    </>
  )
}
