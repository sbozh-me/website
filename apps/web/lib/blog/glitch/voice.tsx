"use client";

import type { CSSProperties, ReactNode } from "react";

import { GLITCH_COLORS } from "./glitch";
import { useGlitchesEnabled } from "./window";

/**
 * A speaker's lines, coloured only while the window is open:
 *
 *   <Voice color="purple">
 *
 *   — Dear Audience. The Founder speaks to you directly.
 *
 *   </Voice>
 *
 * With the window closed it's ordinary article text. Open, the text (and the `||` plain
 * states of any glitch word inside) takes the colour. Unlike a glitch word it wraps, so it
 * holds whole paragraphs. `windowOff` comes from remark-glitch on a `==WINDOW OFF==` page.
 */
export function Voice({
  color,
  windowOff = false,
  children,
}: {
  /** gold | purple | teal | white | red | pink */
  color: string;
  windowOff?: boolean;
  children?: ReactNode;
}) {
  const on = useGlitchesEnabled(windowOff);
  const value = GLITCH_COLORS[color];
  const style =
    on && value ? ({ color: value, "--glitch-plain": value } as CSSProperties) : undefined;

  return (
    <div className="voice" data-voice={color} style={style}>
      {children}
    </div>
  );
}
