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
 * Milliseconds until the hand is back at 12 o'clock. The first number's hand has been
 * turning since first paint, before this code loaded: the count moves on as it comes round.
 */
function untilNextTurn(hand: SVGElement | null): number {
  const turn = hand?.getAnimations?.()[0]
  const at = turn?.playState === "running" ? Number(turn.currentTime) : 0
  return LEADER_TICK_MS - (at % LEADER_TICK_MS)
}

interface HeroLeaderProps {
  /** The video was asked to play and its picture isn't moving yet */
  loading: boolean
  /** The countdown has run out: the video may play */
  onDone: () => void
}

/**
 * The film leader over the home video: 3, 2, 1 in a dial, a clock hand going round once per
 * number and lighting the part it has swept. It is drawn, not a file, so it shows at first
 * paint and the video has the connection to itself while it counts.
 *
 * If the video still can't play when the leader runs out (or stalls later), the brand mark
 * spins fast in the dial's place until the picture moves.
 */
export function HeroLeader({ loading, onDone }: HeroLeaderProps) {
  const [count, setCount] = useState(LEADER_FROM)
  const counting = count > 0
  // Fading out, it keeps its last number
  const shown = Math.max(count, 1)
  const first = shown === LEADER_FROM
  const hand = useRef<SVGLineElement>(null)

  useEffect(() => {
    if (!counting) {
      onDone()
      return
    }
    const wait = count === LEADER_FROM ? untilNextTurn(hand.current) : LEADER_TICK_MS
    const timer = setTimeout(() => setCount((n) => n - 1), wait)
    return () => clearTimeout(timer)
  }, [count, counting, onDone])

  // The first number's hand keeps going round until the client takes over
  const turn = { animationDuration: `${LEADER_TICK_MS}ms`, animationIterationCount: first ? "infinite" : 1 }

  return (
    <>
      <div
        aria-hidden="true"
        data-leader={counting ? "counting" : "done"}
        // Counting, it takes the clicks: the video under it isn't to be started early
        className={`absolute inset-0 grid place-items-center bg-background/85 transition-opacity duration-500 ${
          counting ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg viewBox="0 0 200 200" className="w-[min(60vw,46svh)] max-w-80 overflow-visible text-foreground">
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
              stroke="currentColor"
              strokeOpacity={0.14}
              strokeWidth={DIAL_R}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              transform={`rotate(-90 ${CENTRE} ${CENTRE})`}
            />
            <line
              ref={hand}
              className="leader-hand stroke-secondary"
              style={turn}
              x1={CENTRE}
              y1={CENTRE}
              x2={CENTRE}
              y2={CENTRE - DIAL_R}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
          {/* Crosshair and the two rings */}
          <path d="M-40 100H240M100 -40V240" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1} />
          <circle cx={CENTRE} cy={CENTRE} r={DIAL_R} fill="none" stroke="currentColor" strokeOpacity={0.85} strokeWidth={2.5} />
          <circle cx={CENTRE} cy={CENTRE} r={DIAL_R - 13} fill="none" stroke="currentColor" strokeOpacity={0.85} strokeWidth={1.5} />
          <text
            data-leader-count
            x={CENTRE}
            y={CENTRE}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={104}
            fontWeight={700}
            fill="currentColor"
          >
            {shown}
          </text>
        </svg>
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
