/*
 * Window OFF: a glitch word still glitches, but what it glitches into stays hidden. It is set
 * in a face that draws shapes where the letters should be (`--glitch-font-cipher`, 4-Sided),
 * so the reader sees that there is context here and can't read it until the window opens.
 */

// What such a face is sure to have. Any other character would drop to a readable fallback
// font. Capitals: their shapes are the big ones, and small letters come out as specks.
const SHAPES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * The text as the cipher face sets it: a capital or a digit for each character (its own,
 * when it has one; Cyrillic, punctuation and the ✳ get one picked for them), spaces kept.
 */
export function cipher(text: string): string {
  return Array.from(text, (char) => {
    if (/\s/.test(char)) return " ";
    const capital = char.toUpperCase();
    if (/^[A-Z0-9]$/.test(capital)) return capital;
    return SHAPES[char.codePointAt(0)! % SHAPES.length];
  }).join("");
}
