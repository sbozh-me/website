"use client"

import { useRef, type PointerEvent } from "react"
import Image from "next/image"
import { cn } from "@sbozh/react-ui/lib/utils"
import { SectionTitle } from "./SectionTitle"

export interface HomePosterProps {
  src: string
  alt: string
  width: number
  height: number
  /** Where the poster leads; without it the poster is just a picture */
  href?: string
  /** Heading over the poster */
  title?: string
}

// Degrees the poster leans towards the pointer, edge to edge
const TILT_X = 8
const TILT_Y = 10

/**
 * Announcement poster between the video hero and the promoted series. It stands on an
 * amethyst-to-gold glow, leans towards the mouse and catches a sheen where the pointer is.
 * The poster is dark artwork, so its frame and glow stay the same in every theme.
 */
export function HomePoster({ src, alt, width, height, href, title = "Commercial Promotions" }: HomePosterProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Written straight to CSS variables: a pointer move must not re-render
  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card || event.pointerType !== "mouse") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const rect = card.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    card.style.setProperty("--poster-rx", `${((0.5 - y) * TILT_X).toFixed(2)}deg`)
    card.style.setProperty("--poster-ry", `${((x - 0.5) * TILT_Y).toFixed(2)}deg`)
    card.style.setProperty("--poster-mx", `${(x * 100).toFixed(1)}%`)
    card.style.setProperty("--poster-my", `${(y * 100).toFixed(1)}%`)
  }

  const handleLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.removeProperty("--poster-rx")
    card.style.removeProperty("--poster-ry")
  }

  const poster = (
    <div
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn(
        "relative overflow-hidden rounded-2xl ring-1 ring-white/15",
        "shadow-[0_30px_80px_-20px_rgba(139,92,246,0.28)]",
        "transition-transform duration-300 ease-out will-change-transform"
      )}
      style={{
        transform:
          "rotateX(var(--poster-rx, 0deg)) rotateY(var(--poster-ry, 0deg))",
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 520px) 468px, calc(100vw - 48px)"
        className="block h-auto w-full"
      />
      {/* Sheen under the pointer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at var(--poster-mx, 50%) var(--poster-my, 30%), rgba(255,255,255,0.55), transparent 55%)",
        }}
      />
    </div>
  )

  return (
    <section
      aria-labelledby="home-poster-title"
      // Above the series promo below, so the glow spills over its image instead of being cut by it
      className="relative z-10 flex w-full max-w-3xl flex-col items-center pt-10 md:pt-16"
    >
      {/* Sets the poster apart from the video above; ruled on both sides */}
      <SectionTitle id="home-poster-title" className="mb-10 md:mb-14">
        {title}
      </SectionTitle>
      <div className="group relative isolate w-full max-w-[26rem] [perspective:1200px]">
        {/* Breathing amethyst-to-gold glow the poster stands on */}
        <div
          aria-hidden
          className={cn(
            // Gradient and its travel around the poster: .poster-glow in globals.css
            "poster-glow pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] opacity-35 blur-3xl sm:-inset-8",
            "transition-opacity duration-500 group-hover:opacity-50"
          )}
        />
        {href ? (
          <a
            href={href}
            className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            {poster}
          </a>
        ) : (
          poster
        )}
      </div>
    </section>
  )
}
