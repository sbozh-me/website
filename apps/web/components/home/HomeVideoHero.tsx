"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Pause, Play, Volume2, VolumeX } from "lucide-react"
import { Button } from "@sbozh/react-ui/components/ui/button"
import { HeroDialogue } from "./HeroDialogue"
import type { KagurameScript } from "@/lib/kagurame/script"

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
  /** Kagurame's dialogue, prepared on the server; null when his script is broken */
  script?: KagurameScript | null
}

/**
 * Full-bleed Pan Dude video at the top of the home page. It starts at the very
 * top of the viewport: the home header is absolute and translucent, so the video runs
 * under it. Kagurame's onboarding dialogue sits over it.
 *
 * The first run plays once: when it ends the video fades out to the poster (the
 * section's background) and Kagurame starts talking. After that, Play loops it.
 */
export function HomeVideoHero({ script }: HomeVideoHeroProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Chosen after mount: the server can't know the screen, and a wrong guess would
  // download the other cut first
  const [cut, setCut] = useState<Cut | null>(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [finishedOnce, setFinishedOnce] = useState(false)
  // Ended: the video is hidden so the poster underneath shows, until it plays again
  const [ended, setEnded] = useState(false)
  const [dialogueOpen, setDialogueOpen] = useState(false)
  // What the visitor wants: a cut switch remounts the video, and must not restart one
  // they paused (or that stopped at the end of its first run)
  const wantPlay = useRef(true)

  useEffect(() => {
    const query = window.matchMedia(PORTRAIT_QUERY)
    const update = () => setCut(pickCut())
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  // Starts the video once a cut is picked; a cut switch keeps the sound choice and
  // plays on only if it was playing
  useEffect(() => {
    const video = videoRef.current
    if (!video || !cut) return
    video.muted = muted
    if (wantPlay.current) video.play().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cut])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    wantPlay.current = !playing
    if (playing) video.pause()
    else video.play().catch(() => {})
  }

  const onEnded = () => {
    wantPlay.current = false
    setEnded(true)
    if (finishedOnce) return
    setFinishedOnce(true)
    setDialogueOpen(true)
  }

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
          // No loop on the first run: it ends, pauses, and Kagurame speaks
          loop={finishedOnce}
          muted
          playsInline
          preload="auto"
          aria-label="Pan Dude, Chief Context Officer"
          data-cut={cut}
          data-ended={ended || undefined}
          onPlay={() => {
            setPlaying(true)
            setEnded(false)
          }}
          onPause={() => setPlaying(false)}
          onEnded={onEnded}
          // Clicking the picture pauses and resumes it, like the Play/Pause button
          onClick={togglePlay}
          className={`absolute inset-0 h-full w-full cursor-pointer object-cover transition-opacity duration-700 ${ended ? "opacity-0" : "opacity-100"}`}
        />
      )}

      {/* Fades the video into the page below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />

      <HeroDialogue
        script={script}
        onScroll={scrollTo}
        open={dialogueOpen}
        onOpenChange={setDialogueOpen}
        toolbar={
          cut && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={togglePlay}
                aria-label={playing ? "Pause video" : "Play video"}
                className="rounded-full bg-background/40 backdrop-blur-md"
              >
                {playing ? <Pause /> : <Play />}
                {playing ? "Pause" : "Play"}
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
          )
        }
      />

      {/* Only the arrow catches clicks; the rest of the strip belongs to the video */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center px-6 md:px-12 lg:px-24 [&>*]:pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollDown}
          aria-label="Scroll to content"
          className="text-foreground/80 hover:text-foreground motion-safe:animate-bounce"
        >
          <ChevronDown />
        </Button>
      </div>
    </section>
  )
}
