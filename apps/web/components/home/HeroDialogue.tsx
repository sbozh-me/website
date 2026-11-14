"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { MessageSquare, X } from "lucide-react"
import { Button } from "@sbozh/react-ui/components/ui/button"
import { Glitch, GlitchState } from "@/lib/blog/glitch/glitch"
import { WindowToggle } from "@/lib/blog/glitch/window"
import { resolveLine, type Action, type LatestPost, type NodeId } from "./dialogue"

const SEEN_KEY = "sbozh:kagurame:met"
const TYPE_MS = 22
// Let the video breathe before he starts talking
const OPEN_DELAY_MS = 1200

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1"
  } catch {
    return false
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1")
  } catch {
    // Private mode: he'll just greet them as a stranger again
  }
}

function useTypewriter(text: string, instant: boolean) {
  const [shown, setShown] = useState(instant ? text.length : 0)

  useEffect(() => {
    if (instant) {
      setShown(text.length)
      return
    }
    setShown(0)
    const timer = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          clearInterval(timer)
          return n
        }
        return n + 1
      })
    }, TYPE_MS)
    return () => clearInterval(timer)
  }, [text, instant])

  return {
    visible: text.slice(0, shown),
    done: shown >= text.length,
    skip: () => setShown(text.length),
  }
}

interface HeroDialogueProps {
  latestPost?: LatestPost
  onScroll: (target: "content" | "releases") => void
}

/**
 * RPG-style onboarding: Kagurame talks from the 5th dimension, the visitor picks a reply,
 * and the replies lead to the blog, the Forum, projects, release notes and subscriptions.
 * Number keys pick a reply, Escape tucks him away.
 *
 * The window starts OFF (as `==WINDOW OFF==` in a post): his title reads "17th Company".
 * Open it (button or W) and it glitches into "17th Dimension" and a red "17th Legion".
 */
export function HeroDialogue({ latestPost, onScroll }: HeroDialogueProps) {
  const router = useRouter()
  const reduceMotion = useReducedMotion() ?? false
  // null until he first speaks: nothing shows during the opening delay
  const [open, setOpen] = useState<boolean | null>(null)
  const [node, setNode] = useState<NodeId>("start")
  const [returning, setReturning] = useState(false)

  useEffect(() => {
    setReturning(readSeen())
    const timer = setTimeout(() => setOpen(true), reduceMotion ? 0 : OPEN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [reduceMotion])

  const line = resolveLine(node, { latestPost, returning })
  const { visible, done, skip } = useTypewriter(line.text, reduceMotion)

  const act = useCallback(
    (action: Action) => {
      markSeen()
      if ("goto" in action) setNode(action.goto)
      else if ("decide" in action) setNode("decided")
      else if ("href" in action) router.push(action.href)
      else if ("scroll" in action) {
        setOpen(false)
        onScroll(action.scroll)
      } else setOpen(false)
    },
    [router, onScroll]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return
      if (event.key === "Escape") {
        setOpen(false)
        return
      }
      const index = Number(event.key) - 1
      if (!Number.isInteger(index) || index < 0) return
      if (!done) {
        skip()
        return
      }
      const choice = line.choices[index]
      if (choice) act(choice.action)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, done, skip, line, act])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-4 md:px-12">
      <AnimatePresence mode="wait">
        {open === null ? null : open ? (
          <motion.div
            key="dialogue"
            role="dialog"
            aria-modal="false"
            aria-label="Kagurame"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-auto relative w-full max-w-2xl rounded-lg border border-primary/40 bg-background/75 p-4 font-[family-name:var(--font-jetbrains-mono)] text-sm shadow-[0_0_40px_-12px_var(--color-primary)] backdrop-blur-md md:p-5 md:text-base"
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">
                Kagurame{" "}
                <span className="text-muted-foreground">
                  ·{" "}
                  <Glitch windowOff>
                    <GlitchState plain>17th Company</GlitchState>
                    <GlitchState color="purple">17th Dimension</GlitchState>
                    <GlitchState color="red">17th Legion</GlitchState>
                  </Glitch>
                </span>
              </p>
              <div className="-mr-2 -mt-1 flex shrink-0 items-center gap-1">
                <WindowToggle off />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                  aria-label="Close dialogue"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X />
                </Button>
              </div>
            </div>

            {/* Clicking the line finishes typing it */}
            <p
              onClick={skip}
              aria-live="polite"
              className="min-h-[3lh] cursor-default text-foreground md:min-h-[2lh]"
            >
              {visible}
              {!done && <span className="ml-0.5 inline-block animate-pulse text-primary">▍</span>}
            </p>

            <ol
              aria-label="Replies"
              className={`mt-3 flex flex-col gap-0.5 transition-opacity duration-200 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              {line.choices.map((choice, i) => (
                <li key={`${node}-${choice.label}`}>
                  <Button
                    variant="ghost"
                    onClick={() => act(choice.action)}
                    tabIndex={done ? 0 : -1}
                    className="group h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left font-[inherit] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <span className="w-4 shrink-0 text-primary/60 group-hover:text-secondary">{i + 1}.</span>
                    {choice.label}
                  </Button>
                </li>
              ))}
            </ol>
          </motion.div>
        ) : (
          <motion.div
            key="talk"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto"
          >
            <Button
              variant="outline"
              onClick={() => {
                setNode("start")
                setReturning(readSeen())
                setOpen(true)
              }}
              className="rounded-full bg-background/40 backdrop-blur-md"
            >
              <MessageSquare />
              Talk to Kagurame
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
