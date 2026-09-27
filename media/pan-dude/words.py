"""Script timeline and plain one-word-at-a-time captions (words.ass).

Timeline syntax inside a line:
  Dick~Pitch.    "~" keeps words together as one caption
  need|to        "|" also joins, but breaks the caption onto a new row
  sbozh*ed.*     "*...*" paints that part in the accent colour (gold)
  Pitch.@1.1     "@<seconds>" pins that caption's duration; the rest share what's left
  Pitch.!        "!" freezes the caption: one hit on entry, then no glitch bursts
  Pitch.^        "^" swaps base and accent colours through a glitch midway
  a>b>c^         ">" gives a "^" caption different text after each flip; every extra
                 ">" adds another quick glitch that flips the colours back again
  Pitch.+        "+" fades the caption's words in one by one (no entry hit);
                 "+++" makes the gap between words 3x longer, and so on;
                 "<" shows the first word instantly instead of fading it;
                 "%" makes each word appear with a glitch hit instead of a fade
  Pitch.=        "=" puts a multi-row caption's top row on the centre line (rows hang below)
  _@0.3          "_" is an empty beat: nothing on screen for its duration
  D#ick          "#" censors the next letter with the logo (glitch.py only)
"""

import re
from dataclasses import dataclass
from pathlib import Path

LINES = [
    (0.05, 2.30, "I've built sbozh.*me* to get you *sbozh*ed."),  # frame 0 stays clean
    (2.30, 4.50, "For this, I had to take my *mask* off."),
    (4.50, 6.80, "And here's what I've *found.*"),
    (6.80, 9.20, "LOOK HOW BIG MY *EGO* IS."),
    (9.20, 13.10, "I've become _@0.3 your|*EMPEROR.*>*EMPEROR|for~*us.>*IMPERIUM|for~*us.@2.9!^+++%="),
    (13.10, 14.40, "There is no you, no me."),
    (14.40, 15.40, "Only~*us.*!^"),
    (15.40, 18.40, "But for your comfort, I can appear even like *this.*"),  # rooster arrives at 16.9
    (18.40, 19.90, "You~need|*to~know.*>*to~know*|you~need.!^"),  # rooster's line, up to the flash
    (20.00, 22.00, "I've killed *my*self@0.8!^ 16 times."),
    (22.00, 23.90, "For the *17th,* I need an *audience.*"),
    (23.90, 25.50, "And you can't run away from *me.*"),
    (25.50, 27.20, "We are locked here *together* forever."),
    (27.20, 29.95, "I will go *deep* inside of you, to see what you are made of."),
    (29.95, 31.95, "I will make you stay *naked* in front of me."),
    (31.95, 35.35, "And wait for my _@0.35 D#ick|*Pitch.*@2.2!^+="),  # немая пауза
    (35.35, 36.85, "And there are only *us* to see *it.*"),
    (36.92, 37.70, "Didn't get *it?*"),
    (37.70, 39.20, "Well, we have plenty of time."),
    (39.20, 39.88, "Do~*we?*!^"),
]


@dataclass
class Caption:
    t0: float
    t1: float
    text: str  # may contain *accent* markup and \N row breaks
    first: bool  # first caption of its line
    still: bool
    flip: bool
    reveal: int  # 0 = no fade-in, n = fade-in with n x the normal gap between words
    after: list  # text after each flip (just [text] unless ">" is used)
    instant_first: bool = False
    glitch_in: bool = False
    top_centred: bool = False

    @property
    def plain(self):
        return self.text.replace("*", "").replace("#", "")


def captions(start, end, line):
    """Split a line into Captions by the timeline syntax."""
    items = []
    for token in line.split():
        flags = token[len(token.rstrip("!^+<%=")):]
        token, _, pinned = token.rstrip("!^+<%=").partition("@")
        text = token.replace("~", " ").replace("|", r"\N")
        items.append((text, float(pinned) if pinned else None, flags))

    free = (end - start) - sum(p for _, p, _ in items if p)
    # Longer words stay a bit longer; the constant keeps short words readable
    weights = [len(re.sub(r"\W", "", c.partition(">")[0])) + 3 for c, p, _ in items if not p]
    total = sum(weights) or 1

    t, wi = start, 0
    for i, (text, pinned, flags) in enumerate(items):
        if pinned:
            dur = pinned
        else:
            dur = free * weights[wi] / total
            wi += 1
        text, *after = text.split(">")
        if text != "_":
            yield Caption(t, t + dur, text, i == 0, "!" in flags, "^" in flags, flags.count("+"), after or [text],
                          "<" in flags, "%" in flags, "=" in flags)
        t += dur


def paint(text, base, accent):
    """ASS inline colours for *accent* markup."""
    out, on = [], False
    for i, part in enumerate(text.split("*")):
        if i:
            on = not on
            out.append(rf"{{\1c{accent if on else base}}}")
        out.append(part)
    return "".join(out)


def ts(t):
    cs = round(t * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


HEADER = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 832
PlayResY: 464
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Word,Space Grotesk,44,&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,100,100,1,0,1,3.2,1.5,2,20,20,34,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def main():
    events = []
    for line in LINES:
        for c in captions(*line):
            body = paint(c.text.replace("#", ""), "&HFFFFFF&", "&H0B9EF5&")
            pop = r"{\fscx118\fscy118\t(0,90,\fscx100\fscy100)}"
            events.append(f"Dialogue: 0,{ts(c.t0)},{ts(c.t1)},Word,,0,0,0,,{pop}{body}")

    Path(__file__).with_name("words.ass").write_text(HEADER + "\n".join(events) + "\n")
    print(len(events), "words")


if __name__ == "__main__":
    main()
