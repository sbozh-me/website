"""Corporate cut of the pan-dude loop: the same scene timings as words.py, the script
softened and rewritten for the corporate world and the "context window" idea of the
blog post ("Дарио, так какой стул?").

One word at a time, Space Grotesk (the site font), 30% up from the bottom. White words
with two accents: *orange* (gold, #F59E0B) and `purple` (amethyst, #8B5CF6).
The rest of the timeline syntax is words.py's (~ joins, @ pins, _ is an empty beat).

Usage: python3 corporate.py  -> corporate.ass (832x464) and corporate-shorts.ass (1080x1920),
burned in by build.sh
"""

from pathlib import Path

from words import captions, ts

LINES = [
    (0.05, 2.30, "I've built sbozh.*me* to get you *onboarded.*"),  # frame 0 stays clean
    (2.30, 4.50, "For this, I had to open my `window.`"),
    (4.50, 6.80, "And here's what I've *found.*"),
    (6.80, 9.20, "LOOK HOW BIG MY `CONTEXT` IS."),
    (9.20, 13.10, "I've become your _@0.3 *Chief* `Context` *Officer.*@1.4"),
    (13.10, 14.40, "No silos. No departments."),
    (14.40, 15.40, "Only~`synergy.`"),
    (15.40, 18.40, "For your comfort, I can even dress *business* *casual.*"),  # rooster arrives at 16.9
    (18.40, 19.90, "Let's take this `offline.`"),  # rooster's line, up to the flash
    (20.00, 22.00, "I've *resigned* 16 times."),
    (22.00, 23.90, "For the *17th,* I need a bigger `context` `window.`"),
    (23.90, 25.50, "And you can't close this *tab.*"),
    (25.50, 27.20, "We are in this `sprint` together."),
    (27.20, 29.80, "I will read your whole *context,* to see what you are made of."),
    (29.80, 31.95, "I will keep you *transparent* in front of `me.`@0.6"),
    (31.95, 35.35, "And wait for my _@0.35 *Pitch* `Deck.`@2.2"),
    (35.35, 36.85, "And there is only *us* in this `call.`"),
    (36.92, 37.70, "Didn't get *it?*"),
    (37.70, 39.20, "Well, we have plenty of *tokens.*"),
    (39.20, 39.88, "Do~`we?`"),
]

WHITE = "&HFFFFFF&"
ORANGE = "&H0B9EF5&"  # #F59E0B
PURPLE = "&HF65C8B&"  # #8B5CF6

# (name, width, height, font size, outline, shadow): the 832x464 loop, and a YouTube
# Shorts version of the same loop centre-cropped to 9:16 and scaled to 1080x1920
LAYOUTS = [
    ("corporate.ass", 832, 464, 44, 3.2, 1.5),
    ("corporate-shorts.ass", 1080, 1920, 96, 7, 3),
]


def header(width, height, size, outline, shadow):
    margin_v = round(0.30 * height)  # bottom of the words 30% up from the bottom edge
    return rf"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Word,Space Grotesk,{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,100,100,1,0,1,{outline},{shadow},2,40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def paint(text):
    """ASS inline colours: *orange* and `purple`, white otherwise."""
    out, colour = [], WHITE
    for char in text:
        if char in "*`":
            accent = ORANGE if char == "*" else PURPLE
            colour = WHITE if colour == accent else accent
            out.append(rf"{{\1c{colour}}}")
        else:
            out.append(char)
    return "".join(out)


def main():
    events = []
    for line in LINES:
        for c in captions(*line):
            pop = r"{\fscx118\fscy118\t(0,90,\fscx100\fscy100)}"
            events.append(f"Dialogue: 0,{ts(c.t0)},{ts(c.t1)},Word,,0,0,0,,{pop}{paint(c.text)}")

    for name, *layout in LAYOUTS:
        Path(__file__).with_name(name).write_text(header(*layout) + "\n".join(events) + "\n")
    print(len(events), "words")


if __name__ == "__main__":
    main()
