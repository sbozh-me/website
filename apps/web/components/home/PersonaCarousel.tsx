"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PersonaCard } from "./PersonaCard"
import type { PersonaEntity } from "@/types/persona-entity"

interface PersonaCarouselProps {
  personas: PersonaEntity[]
  onPersonaChange?: (persona: PersonaEntity, index: number) => void
}

const SWIPE_THRESHOLD = 50

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

export function PersonaCarousel({ personas, onPersonaChange }: PersonaCarouselProps) {
  const [[activeIndex, direction], setActiveIndex] = useState([0, 0])

  const navigate = useCallback((newDirection: number) => {
    setActiveIndex(([prevIndex]) => {
      let nextIndex = prevIndex + newDirection
      if (nextIndex < 0) nextIndex = personas.length - 1
      if (nextIndex >= personas.length) nextIndex = 0
      return [nextIndex, newDirection]
    })
  }, [personas.length])

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(([prevIndex]) => {
      const newDirection = index > prevIndex ? 1 : -1
      return [index, newDirection]
    })
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
      {/* Carousel container */}
      <div className="relative flex w-full items-center justify-center">
        {/* Left Arrow */}
        {showNavigation && (
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:left-[-60px] md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous persona"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Slide content */}
        <div className="w-full max-w-lg overflow-hidden px-12 md:px-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag={showNavigation ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              <PersonaCard persona={personas[activeIndex]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        {showNavigation && (
          <button
            onClick={() => navigate(1)}
            className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:right-[-60px] md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next persona"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {showNavigation && (
        <div className="mt-8 flex gap-2">
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
    </div>
  )
}
