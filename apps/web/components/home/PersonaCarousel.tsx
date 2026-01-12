"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PersonaCard } from "./PersonaCard"
import type { PersonaEntity } from "@/types/persona-entity"

interface PersonaCarouselProps {
  personas: PersonaEntity[]
  onPersonaChange?: (persona: PersonaEntity, index: number) => void
}

const SWIPE_THRESHOLD = 50
const STAR_DURATION = 3 // seconds
const CLICKS_TO_SPAWN_STARS = 5
const MAX_STARS = 37 * 2

interface FallingStar {
  id: number
  x: number
  size: number
  rotation: number
  opacity: number
}

function createStar(): FallingStar {
  return {
    id: Date.now() + Math.random(),
    x: Math.random() * 100,
    size: 24 + Math.random() * 48,
    rotation: Math.random() * 720 - 360,
    opacity: 0.2 + Math.random() * 0.5,
  }
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
}

const SETTLE_DELAY = 300 // ms to wait before showing card after rapid clicks

export function PersonaCarousel({ personas, onPersonaChange }: PersonaCarouselProps) {
  const [[activeIndex, direction], setActiveIndex] = useState([0, 0])
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isRapidClicking, setIsRapidClicking] = useState(false)
  const [stars, setStars] = useState<FallingStar[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined)
  const measureRef = useRef<HTMLDivElement>(null)
  const settleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)

  // Remove star after animation completes
  const removeStar = useCallback((id: number) => {
    setStars((prev) => prev.filter((s) => s.id !== id))
  }, [])

  // Measure all cards and set fixed dimensions to the largest
  useEffect(() => {
    const measureCards = () => {
      if (!measureRef.current) return
      const cards = measureRef.current.querySelectorAll('[data-measure-card]')
      let maxHeight = 0
      let maxWidth = 0
      cards.forEach((card) => {
        const el = card as HTMLElement
        if (el.offsetHeight > maxHeight) maxHeight = el.offsetHeight
        if (el.offsetWidth > maxWidth) maxWidth = el.offsetWidth
      })
      if (maxHeight > 0) setContainerHeight(maxHeight)
      if (maxWidth > 0) setContainerWidth(maxWidth)
    }

    measureCards()
    window.addEventListener("resize", measureCards)
    return () => window.removeEventListener("resize", measureCards)
  }, [personas])

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Start settle timer - card will show after delay
  const startSettleTimer = useCallback(() => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current)
    }
    settleTimerRef.current = setTimeout(() => {
      setIsRapidClicking(false)
      clickCountRef.current = 0
    }, SETTLE_DELAY)
  }, [])

  // Spawn a falling star (max 37 at a time)
  const spawnStar = useCallback(() => {
    setStars((prev) => prev.length >= MAX_STARS ? prev : [...prev, createStar()])
  }, [])

  const navigate = useCallback((newDirection: number) => {
    setHasInteracted(true)
    setIsRapidClicking(true)
    startSettleTimer()

    clickCountRef.current += 1
    if (clickCountRef.current >= CLICKS_TO_SPAWN_STARS) {
      spawnStar()
      spawnStar()
    }

    setActiveIndex(([prevIndex]) => {
      let nextIndex = prevIndex + newDirection
      if (nextIndex < 0) nextIndex = personas.length - 1
      if (nextIndex >= personas.length) nextIndex = 0
      return [nextIndex, newDirection]
    })
  }, [personas.length, startSettleTimer, spawnStar])

  const goToSlide = useCallback((index: number) => {
    setHasInteracted(true)
    setIsRapidClicking(true)
    startSettleTimer()

    clickCountRef.current += 1
    if (clickCountRef.current >= CLICKS_TO_SPAWN_STARS) {
      spawnStar()
    }

    setActiveIndex(([prevIndex]) => {
      const newDirection = index > prevIndex ? 1 : -1
      return [index, newDirection]
    })
  }, [startSettleTimer, spawnStar])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current)
      }
    }
  }, [])

  // Notify parent when persona changes
  useEffect(() => {
    onPersonaChange?.(personas[activeIndex], activeIndex)
  }, [activeIndex, personas, onPersonaChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        navigate(-1)
      } else if (e.key === "ArrowRight") {
        navigate(1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [navigate])

  // Swipe handling
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      navigate(-1)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      navigate(1)
    }
  }

  if (personas.length === 0) return null

  const showNavigation = personas.length > 1

  return (
    <div className="relative flex flex-col items-center">
      {/* Hidden measurement container */}
      <div
        ref={measureRef}
        className="pointer-events-none absolute opacity-0"
        style={{ visibility: "hidden", position: "absolute", top: 0, left: 0, width: "100%" }}
        aria-hidden="true"
      >
        <div className="w-full px-12 md:px-0 flex flex-col">
          {personas.map((persona) => (
            <div key={persona.id} data-measure-card>
              <PersonaCard persona={persona} />
            </div>
          ))}
        </div>
      </div>

      {/* Loading logo */}
      {!containerHeight && (
        <div className="absolute left-0 right-0 top-[80px] z-0 flex justify-center pointer-events-none md:top-[240px]">
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={64}
            height={64}
            priority
          />
        </div>
      )}

      {/* Carousel container */}
      <div
        className="relative flex w-full items-center justify-center transition-all duration-500"
        style={{
          visibility: containerHeight ? 'visible' : 'hidden',
          opacity: containerHeight ? 1 : 0,
          transform: containerHeight ? 'translateY(0)' : 'translateY(-20px)'
        }}
      >
        {/* Left Arrow */}
        {showNavigation && (
          <button
            onClick={() => navigate(-1)}
            className="absolute -left-3 top-[80px] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:left-[-60px] md:top-1/2 md:-translate-y-1/2"
            aria-label="Previous persona"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Slide content - fixed dimensions to prevent layout shift */}
        <div
          className={`relative overflow-hidden ${!isMobile ? 'px-12' : ''} md:px-0`}
          style={{ height: containerHeight, width: isMobile ? "100%" : containerWidth }}
        >
          {/* Background logo visible during rapid clicking */}
          {(hasInteracted || isRapidClicking) && (
            <div className="absolute left-0 right-0 top-[70px] z-0 flex justify-center pointer-events-none md:inset-0 md:items-center">
              <Image
                src="/android-chrome-192x192.png"
                alt=""
                width={64}
                height={64}
                priority
              />
            </div>
          )}
          <AnimatePresence mode="wait" custom={direction}>
            {!isRapidClicking && (
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={slideVariants}
                initial={hasInteracted ? "enter" : false}
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag={showNavigation && isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className={isMobile ? "cursor-grab active:cursor-grabbing" : ""}
              >
                <div className="relative">
                  <div className="absolute -inset-x-20 -inset-y-10 z-0 bg-background" />
                  <div className="relative z-10">
                    <PersonaCard persona={personas[activeIndex]} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        {showNavigation && (
          <button
            onClick={() => navigate(1)}
            className="absolute -right-3 top-[80px] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:right-[-60px] md:top-1/2 md:-translate-y-1/2"
            aria-label="Next persona"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {showNavigation && (
        <div
          className="mt-8 flex gap-2 transition-all duration-500 delay-100"
          style={{
            visibility: containerHeight ? 'visible' : 'hidden',
            opacity: containerHeight ? 1 : 0,
            transform: containerHeight ? 'translateY(0)' : 'translateY(-20px)'
          }}
        >
          {personas.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === activeIndex
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to persona ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Falling stars - one per click */}
      {stars.length > 0 && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {stars.map((star) => (
              <motion.div
                key={star.id}
                className="absolute"
                style={{ left: `${star.x}%`, opacity: star.opacity }}
                initial={{ y: "-10vh", rotate: 0, scale: 1 }}
                animate={{
                  y: "110vh",
                  rotate: star.rotation,
                  scale: 0.3,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: STAR_DURATION,
                  ease: "linear",
                }}
                onAnimationComplete={() => removeStar(star.id)}
              >
                <Image
                  src="/android-chrome-192x192.png"
                  alt=""
                  width={star.size}
                  height={star.size}
                  className="drop-shadow-lg"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
