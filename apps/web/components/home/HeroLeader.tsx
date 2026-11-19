"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

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
export function HeroLeader({ loading, onDone }: HeroLeaderProps) {
  const [count, setCount] = useState(LEADER_FROM)
  const counting = count > 0
  // Fading out, it keeps its last number
  const shown = Math.max(count, 1)
  const hand = useRef<SVGLineElement>(null)
  // Scrolled away from the top: the film stands still until the visitor is back
  const [away, setAway] = useState(false)

  useEffect(() => {
    if (!counting) return
    const update = () => setAway(window.scrollY > 0)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [counting])

  useEffect(() => {
    if (!counting) {
      onDone()
      return
    }
    if (away) return
    const timer = setTimeout(() => setCount((n) => n - 1), untilNextTurn(hand.current))
    return () => clearTimeout(timer)
  }, [count, counting, away, onDone])

  // The first number's hand keeps going round until the client takes over
  const turn = {
    animationDuration: `${LEADER_TICK_MS}ms`,
    animationIterationCount: shown === LEADER_FROM ? "infinite" : 1,
  }

  return (
    <>
      {/* Without scripts nothing would ever end the leader, or bring the colour back */}
      <noscript>
        <style>{"[data-leader]{display:none}html{filter:none!important}"}</style>
      </noscript>
      <div
        aria-hidden="true"
        data-leader={counting ? "counting" : "done"}
        data-paused={away && counting ? "" : undefined}
        // Counting, it takes the clicks: the video under it isn't to be started early
        className={`leader-film absolute inset-0 grid place-items-center overflow-hidden transition-opacity duration-500 ${
          counting ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg viewBox="0 0 200 200" className="leader-weave w-[min(60vw,46svh)] max-w-80 overflow-visible">
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
            data-leader-count
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

      {loading && !counting && (
        <div
          role="status"
          aria-label="Loading video"
          // It lets clicks through to the video, and waits a beat before showing: a video
          // that starts at once never flashes it
          className="leader-loading pointer-events-none absolute inset-0 grid place-items-center"
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
      )}
    </>
  )
}
