"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AuthorCard } from "./AuthorCard"
import type { Author } from "@/types/author"

interface AuthorCarouselProps {
  authors: Author[]
  onAuthorChange?: (author: Author, index: number) => void
}

const SWIPE_THRESHOLD = 50
const STAR_DURATION = 3000 // ms
const CLICKS_TO_SPAWN_STARS = 5
const MAX_STARS = 74

// Native DOM star spawner - no React state, pure JS
function spawnNativeStar(container: HTMLDivElement) {
  if (container.childElementCount >= MAX_STARS) return

  const star = document.createElement("img")
  star.src = "/android-chrome-192x192.png"
  star.alt = ""

  const x = Math.random() * 100
  const size = 24 + Math.random() * 48
  const rotation = Math.random() * 720 - 360
  const opacity = 0.2 + Math.random() * 0.5

  star.style.cssText = `
    position: absolute;
    left: ${x}%;
    top: -10vh;
    width: ${size}px;
    height: ${size}px;
    opacity: ${opacity};
    pointer-events: none;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
    will-change: transform;
  `

  container.appendChild(star)

  // Animate using requestAnimationFrame for smooth 60fps
  const startTime = performance.now()
  const startY = -10
  const endY = 110

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / STAR_DURATION, 1)

    const y = startY + (endY - startY) * progress
    const currentRotation = rotation * progress
    const scale = 1 - 0.7 * progress

    star.style.transform = `translateY(${y}vh) rotate(${currentRotation}deg) scale(${scale})`

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      star.remove()
    }
  }

  requestAnimationFrame(animate)
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

export function AuthorCarousel({ authors, onAuthorChange }: AuthorCarouselProps) {
  const [[activeIndex, direction], setActiveIndex] = useState([0, 0])
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isRapidClicking, setIsRapidClicking] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined)
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined)
  const measureRef = useRef<HTMLDivElement>(null)
  const starsContainerRef = useRef<HTMLDivElement>(null)
  const settleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)
  const isAnimatingRef = useRef(false)

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
  }, [authors])

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

  // Spawn a falling star using native DOM
  const spawnStar = useCallback(() => {
    if (starsContainerRef.current) {
      spawnNativeStar(starsContainerRef.current)
    }
  }, [])

  const navigate = useCallback((newDirection: number) => {
    // Prevent navigation while animation is in progress
    if (isAnimatingRef.current) return

    isAnimatingRef.current = true
    setTimeout(() => {
      isAnimatingRef.current = false
    }, 100) // Match spring animation duration

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
      if (nextIndex < 0) nextIndex = authors.length - 1
      if (nextIndex >= authors.length) nextIndex = 0
      return [nextIndex, newDirection]
    })
  }, [authors.length, startSettleTimer, spawnStar])

  const goToSlide = useCallback((index: number) => {
    // Prevent navigation while animation is in progress
    if (isAnimatingRef.current) return

    isAnimatingRef.current = true
    setTimeout(() => {
      isAnimatingRef.current = false
    }, 400) // Match spring animation duration

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

  // Notify parent when author changes
  useEffect(() => {
    onAuthorChange?.(authors[activeIndex], activeIndex)
  }, [activeIndex, authors, onAuthorChange])

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

  if (authors.length === 0) return null

  const showNavigation = authors.length > 1

  return (
    <div className="relative flex flex-col max-sm:w-full items-center">
      {/* Hidden measurement container */}
      <div
        ref={measureRef}
        className="pointer-events-none absolute opacity-0"
        style={{ visibility: "hidden", position: "absolute", top: 0, left: 0, width: "100%" }}
        aria-hidden="true"
      >
        <div className="w-full px-12 md:px-0 flex flex-col">
          {authors.map((author) => (
            <div key={author.id} data-measure-card>
              <AuthorCard author={author} />
            </div>
          ))}
        </div>
      </div>


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
            aria-label="Previous author"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Slide content - fixed dimensions to prevent layout shift */}
        <div
          className={`relative max-sm:w-full overflow-hidden ${!isMobile ? 'px-12' : ''} md:px-0`}
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
                    <AuthorCard author={authors[activeIndex]} />
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
            aria-label="Next author"
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
          {authors.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === activeIndex
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to author ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Falling stars container - native DOM manipulation */}
      <div
        ref={starsContainerRef}
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      />
    </div>
  )
}
