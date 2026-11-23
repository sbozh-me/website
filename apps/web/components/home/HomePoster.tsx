"use client"

import { useRef, useState, type PointerEvent } from "react"
import Image from "next/image"
import { cn } from "@sbozh/react-ui/lib/utils"
import { SectionTitle } from "./SectionTitle"

export interface HomePosterProps {
  src: string
  alt: string
  width: number
  height: number
  /** Where the example poster leads, once flipped and clicked again */
  href?: string
  /** Heading over the poster */
  title?: string
}

// Degrees the poster leans towards the pointer, edge to edge
const TILT_X = 8
const TILT_Y = 10

/**
 * Announcement slot between the video hero and the promoted series. By default it shows
 * a premium "your commercial here" stamp; a click flips the card to the real example
 * poster, which then links to the post. The stamp leans towards the mouse, follows the
 * pointer with a "click to see example" label, and both faces share the amethyst glow.
 */
export function HomePoster({
  src,
  alt,
  width,
  height,
  href,
  title = "Commercial Promotions",
}: HomePosterProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)

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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && flipped) setFlipped(false)
  }

  return (
    <section
      aria-labelledby="home-poster-title"
      // Above the series promo below, so the glow spills over its image instead of being cut by it
      className="relative z-10 flex w-full max-w-3xl flex-col items-center pt-10 md:pt-16"
    >
      <SectionTitle id="home-poster-title" className="mb-10 md:mb-14">
        {title}
      </SectionTitle>
      <div className="group relative isolate w-full max-w-[26rem] [perspective:1400px]">
        {/* Breathing amethyst-to-gold glow the poster stands on */}
        <div
          aria-hidden
          className={cn(
            "poster-glow pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] opacity-35 blur-3xl sm:-inset-8",
            "transition-opacity duration-500 group-hover:opacity-50",
          )}
        />
        <div
          ref={cardRef}
          data-poster-card
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
          onKeyDown={handleKey}
          className="relative w-full [transform-style:preserve-3d] [aspect-ratio:853/1280]"
          style={{
            transform:
              "rotateX(var(--poster-rx, 0deg)) rotateY(calc(var(--poster-ry, 0deg) + var(--poster-flip, 0deg)))",
            ["--poster-flip" as string]: flipped ? "180deg" : "0deg",
            transition: "transform 650ms cubic-bezier(0.22, 0.9, 0.3, 1.1)",
          }}
        >
          {/* Front: stamp */}
          <div
            className={cn(
              "absolute inset-0 [backface-visibility:hidden]",
              flipped && "pointer-events-none",
            )}
            aria-hidden={flipped}
          >
            <StampCard
              onFlip={() => setFlipped(true)}
              interactive={!flipped}
            />
          </div>

          {/* Back: the real example poster, linked to the post */}
          <div
            className={cn(
              "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]",
              !flipped && "pointer-events-none",
            )}
            aria-hidden={!flipped}
          >
            <ExamplePoster
              src={src}
              alt={alt}
              width={width}
              height={height}
              href={href}
              revealed={flipped}
              onBack={() => setFlipped(false)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function StampCard({
  onFlip,
  interactive,
}: {
  onFlip: () => void
  interactive: boolean
}) {
  return (
    <button
      type="button"
      onClick={onFlip}
      tabIndex={interactive ? 0 : -1}
      aria-label="Your commercial here. Click to see example."
      className={cn(
        "group/stamp relative block h-full w-full cursor-pointer rounded-2xl text-left",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
      )}
    >
      {/* Perforated stamp body: dark panel with scalloped edges on all four sides */}
      <div
        className="absolute inset-0 overflow-hidden bg-[#0a0a0f] shadow-[0_30px_80px_-20px_rgba(139,92,246,0.28)]"
        style={{
          // Repeated radial-gradient cut-outs along each edge form the stamp perforations
          WebkitMask:
            "radial-gradient(circle 7px at 50% 0, #0000 98%, #000) 0 0 / 22px 100% repeat-x, radial-gradient(circle 7px at 50% 100%, #0000 98%, #000) 0 0 / 22px 100% repeat-x, radial-gradient(circle 7px at 0 50%, #0000 98%, #000) 0 0 / 100% 22px repeat-y, radial-gradient(circle 7px at 100% 50%, #0000 98%, #000) 0 0 / 100% 22px repeat-y",
          WebkitMaskComposite: "source-in",
          mask: "radial-gradient(circle 7px at 50% 0, #0000 98%, #000) 0 0 / 22px 100% repeat-x, radial-gradient(circle 7px at 50% 100%, #0000 98%, #000) 0 0 / 22px 100% repeat-x, radial-gradient(circle 7px at 0 50%, #0000 98%, #000) 0 0 / 100% 22px repeat-y, radial-gradient(circle 7px at 100% 50%, #0000 98%, #000) 0 0 / 100% 22px repeat-y",
          maskComposite: "intersect",
        }}
      >
        {/* Amethyst wash so the stamp sits on the right colour inside the perforations */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 60% at 50% 0%, rgba(139,92,246,0.22), transparent 60%), radial-gradient(90% 60% at 50% 100%, rgba(245,158,11,0.12), transparent 60%)",
          }}
        />

        {/* Inked border inside the perforations */}
        <div className="absolute inset-5 rounded-sm border border-white/30" />
        <div className="absolute inset-7 rounded-sm border border-dashed border-white/15" />

        {/* Grid with three equal rows locks the promise to the stamp's vertical
           center (middle row), while the deal and issuer stay in the top and
           bottom thirds instead of drifting with content height. */}
        <div className="absolute inset-0 grid grid-rows-3 px-8 pb-8 pt-12 text-center">
          {/* Deal: Your 200 EUR / My 60 min */}
          <div className="flex flex-col items-center">
            <span className="font-serif text-[clamp(0.9rem,3.4cqw,1.1rem)] italic leading-none text-white/70">
              Your
            </span>
            <span
              className="mt-1 font-sans text-[clamp(2.5rem,13cqw,4rem)] font-black leading-[0.95] tracking-tight text-secondary"
              style={{ textShadow: "0 0 24px rgba(245,158,11,0.35)" }}
            >
              200 EUR
            </span>
            <span className="mt-3 font-serif text-[clamp(0.9rem,3.4cqw,1.1rem)] italic leading-none text-white/70">
              My
            </span>
            <span
              className="mt-1 font-sans text-[clamp(2rem,11cqw,3.25rem)] font-black leading-[0.95] tracking-tight text-primary"
              style={{ textShadow: "0 0 24px rgba(139,92,246,0.4)" }}
            >
              60 min
            </span>
          </div>

          {/* Promise: stacked "YOUR / COMMERCIAL / HERE*" with the footnote,
             centered inside its middle row so it sits at the card's midline. */}
          <div className="flex flex-col items-center justify-center">
            <h3 className="font-sans text-[clamp(1.1rem,5.2cqw,1.75rem)] font-bold uppercase leading-[1] tracking-[0.04em] text-white">
              Your
              <br />
              commercial
              <br />
              here
              <span
                aria-hidden
                className="bg-gradient-to-br from-primary to-secondary bg-clip-text align-top text-transparent"
              >
                *
              </span>
            </h3>

            <div className="mt-4 h-px w-14 bg-white/25" />
          </div>

          {/* Bottom: the footnote sits flush against the cartouche, both pushed
             to the stamp's lower edge with justify-end. */}
          <div className="flex flex-col items-center justify-end gap-4">
            <p className="max-w-[20rem] font-serif text-[clamp(0.7rem,2.5cqw,0.8rem)] italic leading-relaxed text-white/75">
              <span className="text-white/50">*</span> Made by sbozh.me after a
              conversation. The conversation costs{" "}
              <span className="not-italic text-secondary">200 EUR</span> and
              grants <span className="not-italic text-primary">60 min</span>{" "}
              of my attention. Let&apos;s learn what we could create together.
            </p>
            <div className="flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.3em] text-white/60">
              <span className="h-px w-5 bg-white/20" />
              <span>SBOZH.ME · MMXXVI</span>
              <span className="h-px w-5 bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Cursor-following label: "Click to see example" sits where the pointer is */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10 whitespace-nowrap rounded-full bg-black/80 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-white ring-1 ring-primary/50 backdrop-blur",
          "opacity-0 transition-opacity duration-200 group-hover/stamp:opacity-100",
        )}
        style={{
          left: "var(--poster-mx, 50%)",
          top: "var(--poster-my, 50%)",
          transform: "translate(14px, 14px)",
        }}
      >
        Click to see example →
      </span>
    </button>
  )
}

function ExamplePoster({
  src,
  alt,
  width,
  height,
  href,
  revealed,
  onBack,
}: {
  src: string
  alt: string
  width: number
  height: number
  href?: string
  revealed: boolean
  onBack: () => void
}) {
  const image = (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 520px) 468px, calc(100vw - 48px)"
        className="block h-full w-full object-cover"
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
    </>
  )

  return (
    <div
      className={cn(
        "relative block h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/15",
        "shadow-[0_30px_80px_-20px_rgba(139,92,246,0.28)]",
      )}
    >
      {href ? (
        <a
          href={href}
          tabIndex={revealed ? 0 : -1}
          aria-hidden={!revealed}
          className="block h-full w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          {image}
        </a>
      ) : (
        image
      )}

      {/* FLIP BACK sits above the link so clicks on it don't navigate */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onBack()
        }}
        tabIndex={revealed ? 0 : -1}
        className="absolute left-3 top-3 z-20 cursor-pointer rounded-full bg-black/70 px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-white/80 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-black/90"
      >
        ← FLIP BACK
      </button>
    </div>
  )
}
