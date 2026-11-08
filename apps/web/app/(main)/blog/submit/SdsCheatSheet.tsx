import { WindowToggle } from "@/lib/blog/glitch/window";
import { compileSummary } from "@/lib/releases/compile-summary";

const SDS_POST = "/blog/words-that-dont-stay-still";

/**
 * The SDS cheat sheet with live examples: what you type, what readers see, and the
 * window switch to flip them. Examples are fixed strings from this file, compiled by the
 * same remark-glitch pipeline as posts (never anything a visitor typed).
 */
interface Example {
  readonly code: string;
  readonly note: string;
  /** Markdown for the live column; defaults to `code` */
  readonly live?: string;
}

const EXAMPLES: readonly Example[] = [
  { code: "==word|meaning==", note: "a word that glitches into a second meaning" },
  { code: "==word|red:meaning==", note: "colours: gold, purple, teal, white, red, pink" },
  { code: "==a|b|c==", note: "several states, one after another" },
  { code: "==calm|BLINK!==", note: "! at the end: it blinks" },
  { code: "===sure|red:100% sure===", note: "ignores the window, keeps glitching when it's off" },
  { code: "==|only with the window open==", note: "exists only while the window is open" },
  { code: "х(;)й", note: "the ✳ censors one letter" },
  {
    code: '<Voice color="teal">…</Voice>',
    live: '<Voice color="teal">\n\n— Ave, reader. These lines are teal.\n\n</Voice>',
    note: "a speaker's lines in a colour, while the window is open",
  },
];

/** Monospace syntax, without the font's ligatures turning `==` into `═`. */
const CODE = "font-mono text-sm text-foreground [font-variant-ligatures:none]";

export async function SdsCheatSheet() {
  const rendered = await Promise.all(EXAMPLES.map((example) => compileSummary(example.live ?? example.code)));

  return (
    <section aria-labelledby="sds" className="mt-10 space-y-4 text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sds" className="text-lg text-foreground">
          Words that don&apos;t stay still
        </h2>
        <WindowToggle />
      </div>
      <p>
        Plain text is fine. Markdown works. And you can use the site&apos;s glitch syntax
        (SDS), the same one the posts here use. Flip the window to see what readers who turn
        the effects off get.{" "}
        <a href={SDS_POST} className="text-primary hover:underline">
          Full guide
        </a>
        .
      </p>

      <dl className="divide-y divide-border rounded-md border border-border">
        {EXAMPLES.map((example, index) => (
          <div
            key={example.code}
            className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,3fr)] md:items-center md:gap-6"
          >
            <dt>
              <code className={CODE}>{example.code}</code>
            </dt>
            <dd className="text-foreground [&_.voice]:my-0 [&_p]:m-0" data-testid="sds-live">
              {rendered[index]}
            </dd>
            <dd className="text-sm">{example.note}</dd>
          </div>
        ))}
        <div className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] md:items-center md:gap-6">
          <dt>
            <code className={CODE}>---</code>
          </dt>
          <dd className="text-sm">
            Frontmatter at the top: <code className={CODE}>title</code>,{" "}
            <code className={CODE}>excerpt</code>, <code className={CODE}>tags</code>,{" "}
            <code className={CODE}>tldr</code>. Or start the text with{" "}
            <code className={CODE}>**TL;DR:**</code>. No <code className={CODE}>image</code>: the
            hero image is TheEmperor&apos;s call. Check it all in Preview below.
          </dd>
        </div>
      </dl>
    </section>
  );
}
