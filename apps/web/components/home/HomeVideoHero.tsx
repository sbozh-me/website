"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Volume2, VolumeX } from "lucide-react"
import { Button } from "@sbozh/react-ui/components/ui/button"
import { HeroDialogue } from "./HeroDialogue"
import type { LatestPost } from "./dialogue"

// One landscape poster for both cuts: object-cover crops it to the screen
const POSTER = "/videos/home/pan-dude-poster.jpg"

const CUTS = {
  desktop: { src: "/videos/home/pan-dude-desktop.mp4", poster: POSTER },
  mobile: { src: "/videos/home/pan-dude-mobile.mp4", poster: POSTER },
} as const

type Cut = keyof typeof CUTS

// Portrait screens get the 9:16 reels cut, everything else the landscape one
const PORTRAIT_QUERY = "(orientation: portrait)"

function pickCut(): Cut {
  return window.matchMedia(PORTRAIT_QUERY).matches ? "mobile" : "desktop"
}

interface HomeVideoHeroProps {
  /** Offered by Kagurame as the freshest read */
  latestPost?: LatestPost
}

/**
 * Full-bleed Pan Dude video at the top of the home page. It starts at the very
 * top of the viewport: the home header is absolute and translucent, so the video runs
 * under it. Kagurame's onboarding dialogue sits over it.
 */
export function HomeVideoHero({ latestPost }: HomeVideoHeroProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Chosen after mount: the server can't know the screen, and a wrong guess would
  // download the other cut first
  const [cut, setCut] = useState<Cut | null>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const query = window.matchMedia(PORTRAIT_QUERY)
    const update = () => setCut(pickCut())
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  // A cut switch swaps the source: keep the sound choice and play on
  useEffect(() => {
    const video = videoRef.current
    if (!video || !cut) return
    video.muted = muted
    video.play().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cut])

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    const next = !muted
    video.muted = next
    setMuted(next)
    if (!next) video.play().catch(() => {})
  }

  const sectionRef = useRef<HTMLElement>(null)

  const scrollDown = () => {
    window.scrollTo({ top: sectionRef.current?.offsetHeight ?? window.innerHeight, behavior: "smooth" })
  }

  const scrollTo = (target: "content" | "releases") => {
    const releases = target === "releases" ? document.getElementById("releases") : null
    if (releases) releases.scrollIntoView({ behavior: "smooth", block: "start" })
    else scrollDown()
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Pan Dude, Chief Context Officer"
      // The poster shows from the first paint, before the cut is picked on the client
      style={{ backgroundImage: `url(${POSTER})` }}
      className="relative h-svh w-full overflow-hidden bg-background bg-cover bg-center"
    >
      {cut && (
        <video
          ref={videoRef}
          key={cut}
          src={CUTS[cut].src}
          poster={CUTS[cut].poster}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Pan Dude, Chief Context Officer"
          data-cut={cut}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Fades the video into the page below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

      <HeroDialogue latestPost={latestPost} onScroll={scrollTo} />

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-between px-6 md:px-12 lg:px-24">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollDown}
          aria-label="Scroll to content"
          className="text-foreground/80 hover:text-foreground motion-safe:animate-bounce"
        >
          <ChevronDown />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSound}
          aria-label={muted ? "Unmute video" : "Mute video"}
          aria-pressed={!muted}
          className="rounded-full bg-background/40 backdrop-blur-md"
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>
    </section>
  )
}
