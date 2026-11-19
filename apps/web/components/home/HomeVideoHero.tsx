"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, Pause, Play, Volume2, VolumeX } from "lucide-react"
import { Button } from "@sbozh/react-ui/components/ui/button"
import { HeroDialogue } from "./HeroDialogue"
import { HeroLeader } from "./HeroLeader"
import type { KagurameScript } from "@/lib/kagurame/script"
import { browserQualityEnv, chooseQuality, quickQuality, type Quality, type Rendition } from "./video-quality"

// One landscape poster for both cuts: object-cover crops it to the screen
const POSTER = "/videos/home/pan-dude-poster.jpg"

// Each cut in SD and HD (1080p, from the finalv100 HD masters: media/pan-dude/web-encode.swift).
// HD only where the screen and the network are up to it (video-quality.ts).
const CUTS = {
  desktop: {
    sd: "/videos/home/pan-dude-desktop.mp4",
    hd: "/videos/home/pan-dude-desktop-hd.mp4",
    sdLongEdge: 832,
    hdMbps: 4.7,
    poster: POSTER,
  },
  mobile: {
    sd: "/videos/home/pan-dude-mobile.mp4",
    hd: "/videos/home/pan-dude-mobile-hd.mp4",
    sdLongEdge: 1280,
    hdMbps: 4.8,
    poster: POSTER,
  },
} as const satisfies Record<string, Rendition & { poster: string }>

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
 * It opens on a 3-2-1 film leader (HeroLeader). The video's file is picked and starts
 * downloading as the leader starts, and plays when it runs out; if it isn't ready by then,
 * the brand mark spins until it is.
 *
 * The first run plays once: when it ends the video fades out to the poster (the
 * section's background) and Kagurame starts talking. After that, Play loops it.
 */
export function HomeVideoHero({ script }: HomeVideoHeroProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Chosen after mount: the server can't know the screen, and a wrong guess would
  // download the other cut first
  const [cut, setCut] = useState<Cut | null>(null)
  // SD or HD, decided once per cut before it loads, so nobody downloads both
  const [qualities, setQualities] = useState<Partial<Record<Cut, Quality>>>({})
  const quality = cut ? qualities[cut] : undefined
  const src = cut && quality ? CUTS[cut][quality] : undefined
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [finishedOnce, setFinishedOnce] = useState(false)
  // Ended: the video is hidden so the poster underneath shows, until it plays again
  const [ended, setEnded] = useState(false)
  const [dialogueOpen, setDialogueOpen] = useState(false)
  // The 3-2-1 leader is still counting: the video downloads, and plays when it runs out
  const [counting, setCounting] = useState(true)
  const endLeader = useCallback(() => setCounting(false), [])
  // Asked to play, and the picture isn't moving yet (not enough of the file, or a stall)
  const [loading, setLoading] = useState(false)
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

  // Picks SD or HD for a cut the first time it shows: at once when the screen, the browser's
  // network hints or this session already know, else after a short probe of the HD file
  useEffect(() => {
    if (!cut || qualities[cut]) return
    let cancelled = false
    const decide = (q: Quality) => !cancelled && setQualities((known) => ({ ...known, [cut]: q }))
    const env = browserQualityEnv()
    const quick = quickQuality(CUTS[cut], env)
    if (quick) decide(quick)
    else chooseQuality(CUTS[cut], env).then(decide)
    return () => {
      cancelled = true
    }
  }, [cut, qualities])

  const play = (video: HTMLVideoElement) => {
    // Not enough of the file yet: the brand mark spins until the picture moves (onPlaying)
    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) setLoading(true)
    video.play().catch(() => {
      // Refused (autoplay blocked) or paused first: back to the poster and the Play button.
      // A cut switch drops the old video's play the same way; that isn't the new one's news.
      if (videoRef.current === video) setLoading(false)
    })
  }

  // Starts the video once the leader has run out and its file is picked (it has been
  // downloading meanwhile); a cut switch keeps the sound choice and plays on only if it
  // was playing
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src || counting) return
    video.muted = muted
    if (wantPlay.current) play(video)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, counting])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    wantPlay.current = !playing
    if (playing) video.pause()
    else play(video)
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
    if (!next) play(video)
  }

  const sectionRef = useRef<HTMLElement>(null)

  const scrollDown = () => {
    // The fixed header stays on top: land the content just under it
    const header = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0
    const hero = sectionRef.current?.offsetHeight ?? window.innerHeight
    window.scrollTo({ top: hero - header, behavior: "smooth" })
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
      // Dark on a dark video whatever the reader's theme: buttons, Kagurame, his box
      data-theme-island="obsidian-forge"
      // The site header turns from dark glass to the reader's theme once this is behind it
      data-home-hero
    >
      {cut && (
        <video
          ref={videoRef}
          key={cut}
          src={src}
          poster={CUTS[cut].poster}
          data-quality={quality}
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
          onPause={() => {
            setPlaying(false)
            setLoading(false)
          }}
          onPlaying={() => setLoading(false)}
          // Ran out of downloaded video mid-play
          onWaiting={(event) => !event.currentTarget.paused && setLoading(true)}
          onError={() => setLoading(false)}
          onEnded={onEnded}
          // Clicking the picture pauses and resumes it, like the Play/Pause button
          onClick={togglePlay}
          className={`absolute inset-0 h-full w-full cursor-pointer object-cover transition-opacity duration-700 ${ended ? "opacity-0" : "opacity-100"}`}
        />
      )}

      <HeroLeader loading={loading} onDone={endLeader} />

      <HeroDialogue
        script={script}
        onScroll={scrollTo}
        open={dialogueOpen}
        onOpenChange={setDialogueOpen}
        toolbar={
          // Nothing to control while the leader counts
          cut &&
          !counting && (
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
      {/* Amethyst-to-gold light travelling along the video's bottom edge: .hero-glow in globals.css */}
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-[0.18] blur-2xl" />
      <div aria-hidden className="hero-glow-line pointer-events-none absolute inset-x-0 bottom-0 h-0.5 opacity-30" />
    </section>
  )
}
