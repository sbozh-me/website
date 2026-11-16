import type { ReactNode } from "react"
import { cn } from "@sbozh/react-ui/lib/utils"

interface SectionTitleProps {
  /** Lets a section name itself after its title (aria-labelledby) */
  id?: string
  children: ReactNode
  className?: string
}

/**
 * Small ruled heading that sets one part of the home page apart from the next:
 * gold monospace caps with a fading amethyst line on both sides.
 */
export function SectionTitle({ id, children, className }: SectionTitleProps) {
  return (
    <div className={cn("flex w-full max-w-3xl items-center gap-4", className)}>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/50" />
      <h2
        id={id}
        // Global h2 rules are unlayered, so size and weight need `!` to win
        className="text-center font-mono text-sm! font-medium! uppercase tracking-[0.3em] text-secondary"
      >
        {children}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/50" />
    </div>
  )
}
