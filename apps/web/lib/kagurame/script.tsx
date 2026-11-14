import { readFile } from "fs/promises"
import { join } from "path"
import type { ComponentType, ReactNode } from "react"
import { DickPitch, Glitch, Sbozhed } from "@/lib/blog/glitch/glitch"
import { glitchMdxComponents } from "@/lib/blog/glitch/mdx-components"
import { Voice } from "@/lib/blog/glitch/voice"
import { compileTitle, hasTitleMarkup } from "@/lib/blog/title"
import {
  fillPlaceholders,
  lineKey,
  parseFabula,
  splitTitle,
  validateFabula,
  variantHolds,
  type Fabula,
  type LatestPost,
  type Problem,
} from "./fabula"

/** Kagurame's script, relative to the app (`process.cwd()`); the build traces it into the image. */
export const SCRIPT_FILE = join("content", "kagurame", "onboarding.fabula")

/** A line with glitch syntax: typed out as `plain`, then swapped for the rendered `node`. */
export interface ScriptLine {
  plain: string
  node: ReactNode
}

/** Everything the dialogue needs, ready on the server. */
export interface KagurameScript {
  fabula: Fabula
  latestPost?: LatestPost
  /** "Kagurame" from `@title` */
  name: string
  /** What follows the name's " · " */
  subtitle?: ScriptLine
  /** Lines with glitch syntax, compiled, by `lineKey(scene, variant)` */
  lines: Record<string, ScriptLine>
}

// MDX hands these the props remark-glitch wrote
type Props = any

// The dialogue's window starts OFF, so its glitch words render plain until it's opened
// (as remark-glitch marks them on a `==WINDOW OFF==` page)
const lineComponents: Record<string, ComponentType<any>> = {
  ...glitchMdxComponents,
  Glitch: (props: Props) => <Glitch {...props} windowOff />,
  DickPitch: (props: Props) => <DickPitch {...props} windowOff />,
  Sbozhed: (props: Props) => <Sbozhed {...props} windowOff />,
  Voice: (props: Props) => <Voice {...props} windowOff />,
  // A line sits in the dialogue's own <p>
  p: ({ children }: { children?: ReactNode }) => <>{children}</>,
}

/** A line with glitch syntax or markdown, compiled the way post titles are; null when it's plain. */
export async function compileLine(text: string): Promise<ScriptLine | null> {
  if (!hasTitleMarkup(text)) return null
  try {
    const { text: plain, Title } = await compileTitle(text)
    return { plain, node: <Title components={lineComponents} /> }
  } catch (error) {
    console.error(`Kagurame: can't compile "${text}", it shows as written`, error)
    return null
  }
}

export function formatProblem({ severity, line, message }: Problem): string {
  return `${line ? `line ${line}` : "script"}: ${severity}: ${message}`
}

/**
 * Reads, validates and prepares the script for the home page. A broken script never takes
 * the page down: the problems are logged and the dialogue stays hidden (null).
 */
export async function loadKagurameScript(latestPost?: LatestPost): Promise<KagurameScript | null> {
  let source: string
  try {
    source = await readFile(join(process.cwd(), SCRIPT_FILE), "utf-8")
  } catch (error) {
    console.error(`Kagurame: can't read ${SCRIPT_FILE}, the dialogue is hidden`, error)
    return null
  }

  const { fabula, problems } = parseFabula(source)
  // No route check here: the running app has no app/ source tree (the test and the CLI do it)
  const errors = [...problems, ...validateFabula(fabula)].filter((p) => p.severity === "error")
  if (errors.length) {
    console.error(`Kagurame: ${SCRIPT_FILE} is broken, the dialogue is hidden\n${errors.map(formatProblem).join("\n")}`)
    return null
  }

  const lines: Record<string, ScriptLine> = {}
  await Promise.all(
    fabula.scenes.flatMap((scene) =>
      scene.variants.map(async (variant, index) => {
        // A ?latest line that can't hold is never said
        if (variant.kind === "latest" && !variantHolds(variant, { returning: false, latestPost })) return
        const line = await compileLine(fillPlaceholders(variant.text, latestPost))
        if (line) lines[lineKey(scene.id, index)] = line
      })
    )
  )

  const { name, subtitle } = splitTitle(fabula.title)
  return {
    fabula,
    latestPost,
    name,
    subtitle: subtitle ? ((await compileLine(subtitle)) ?? { plain: subtitle, node: subtitle }) : undefined,
    lines,
  }
}
