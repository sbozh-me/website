"""Word-by-word captions in the glitch style of font.mp4, in brand colours.

Resting state: one word, amethyst with an obsidian outline, with a couple of
thin horizontal slices nudged sideways so the glyph edges look notched.
Bursts (a few frames): the word jumps in scale and colour, with a terminal-green
and an obsidian echo offset behind it and slices displaced harder.
Every event starts/ends on a 24fps frame boundary so nothing flickers.
"""

import math
import os
import random
import re
from pathlib import Path

from words import LINES, captions, paint

FPS = 24
W, H = 832, 464
SIZE = 56
X = W // 2
Y = round(H / 2 + SIZE * 0.475)  # \an2 baseline so the cap box is centred
LINE_H = SIZE  # row pitch for multi-row captions
# Between DICK PITCH. and DO WE? captions sit 20% of the frame lower (off the face);
# DO WE? comes back to the centre
LOWER_FROM, LOWER_UNTIL, LOWER_BY = 35.35, 39.20, round(0.20 * H)

# FORMAT=shorts: a YouTube Short. The loop is centre-cropped to 9:16 and scaled to
# 1080x1920. Captions are laid out in the crop window's own scene coordinates (W x H below);
# libass scales that PlayRes up to the video, so only the ffmpeg logo overlay needs
# converting to output pixels (OUT_SCALE). A smaller font keeps the longest words (and
# the 128% bursts) inside the narrow frame. Outputs get a "-shorts" suffix.
SHORTS = os.environ.get("FORMAT") == "shorts"
CROP_X0 = 0.0  # scene x of the frame's left edge
OUT_SCALE = 1.0  # output pixels per scene pixel
if SHORTS:
    CROP_X0 = (W - H * 9 / 16) / 2
    W = round(H * 9 / 16)
    SIZE = 36
    X = W // 2
    Y = round(H / 2 + SIZE * 0.475)
    LINE_H = SIZE
    OUT_SCALE = 1920 / H

AMETHYST = "&HF65C8B&"
GOLD_C = "&H0B9EF5&"
ECHO = "&HDBE86C&"  # #6CE8DB
OBSIDIAN = "&H0F0A0A&"

# Bursts: one on every line entry, then roughly every 0.6-1.8s like the reference
ENTRY_FRAMES = 3
GAP = (0.6, 1.8)
BURST_FRAMES = (2, 5)

# "^" captions swap base/accent colours through this many glitch frames midway
FLIP_FRAMES = 4

# "+" captions fade their words in one by one (ms)
REVEAL_STEP = 600
REVEAL_FADE = 350
REVEAL_HOLD = 0.45  # s between the last word landing and a "^" flip
REFLIP_HOLD = 0.45  # s a ">" state holds before the next flip

# "#" hides the next letter and covers it with the logo (overlaid by ffmpeg, see glitch.filter).
# Centre of the hidden glyph relative to the caption anchor, measured by rendering the I of
# DICK\NPITCH. in red (Retron2000 56px): glyph box 390-412 x 190-220 at anchor (416, 287).
CENSOR_OFFSET = (-15, -82)
CENSOR_SIZE = 34  # logo itself; logo-outlined.png (from logo.py) adds a border around it
LOGO_BORDER = 226 / 192  # outlined image side / logo side
# On the flip the logo spins pi turns and lands wherever pi leaves it (0.14 turn off)
SPIN_TURNS = 3.14
SPIN_DUR = 0.55  # s, ease-out

# VARIANT=tracked: the "#" caption is stuck to the scene instead of the screen. The logo sits
# on this point (measured on the frames: where the figure's torso meets the seat backs) and
# the caption, at constant size, rides it down as the camera pushes in until it leaves the
# frame at the cut. Output goes to glitch-tracked.ass / glitch-tracked.filter.
TRACKED = os.environ.get("VARIANT") == "tracked"
SUFFIX = "-tracked" if TRACKED else ""
# VARIANT=logo-tracked: the "#" caption stays centred with its letter left blank, and only
# the logo rides the tracked point until the cut. Output: glitch[-corporate]-logo-tracked.*
LOGO_TRACKED = os.environ.get("VARIANT") == "logo-tracked"
if LOGO_TRACKED:
    SUFFIX = "-logo-tracked"

# SCRIPT=corporate: the corporate script (corporate.GLITCH_LINES) in this same glitch look,
# written to glitch-corporate[-tracked].ass / .filter; the censored letter is the P of PITCH
if os.environ.get("SCRIPT") == "corporate":
    from corporate import GLITCH_CENSOR_OFFSET as CENSOR_OFFSET, GLITCH_LINES as LINES
    SUFFIX = "-corporate" + SUFFIX
if SHORTS:
    SUFFIX += "-shorts"
    # the censored letter's offset and logo scale with the smaller font; a logo tracked
    # onto the figure keeps its scene size
    CENSOR_OFFSET = tuple(round(v * SIZE / 56) for v in CENSOR_OFFSET)
    if not LOGO_TRACKED:
        CENSOR_SIZE = round(CENSOR_SIZE * SIZE / 56)
TRACK_X = 419
TRACK_Y = [(33.54, 290), (33.75, 305), (34.0, 324), (34.5, 349), (35.0, 369),
           (35.5, 394), (36.0, 422), (36.5, 455), (36.92, 485)]  # (s, y), linear in between
TRACK_UNTIL = 36.92  # the cut to the hooded guy

rng = random.Random(25)
burst_params = {}  # frame -> (scale, dx, dy) of the main copy, for the logo to follow


def track_point(fr):
    """Tracked scene point at frame fr (held before the first key), in frame coordinates
    (shifted into the crop window for FORMAT=shorts)."""
    t = fr / FPS
    for (t0, y0), (t1, y1) in zip(TRACK_Y, TRACK_Y[1:]):
        if t <= t1:
            return TRACK_X - CROP_X0, y0 + (y1 - y0) * max(0.0, (t - t0) / (t1 - t0))
    return TRACK_X - CROP_X0, TRACK_Y[-1][1]


def ts(frame):
    # floor keeps start <= frame time and end > previous frame time
    cs = math.floor(frame / FPS * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def bands(count, max_h, y, rows):
    """Random horizontal strips inside the glyph box, as (top, bottom)."""
    top, bottom = y - (rows - 1) * LINE_H - SIZE * 0.78, y - SIZE * 0.17  # Retron2000 cap box
    out = []
    for _ in range(count):
        y1 = rng.uniform(top, bottom - max_h)
        out.append((round(y1), round(y1 + rng.randint(2, max_h))))
    return out


def clip_path(strips):
    return " ".join(f"m 0 {a} l {W} {a} {W} {b} 0 {b}" for a, b in strips)


def censor(text):
    """Make the letter after "#" invisible but keep its space, restoring whatever alpha
    (including a running fade-in) was in effect before it. With the logo tracked away from
    the caption (VARIANT=logo-tracked) nothing covers the letter, so it stays visible."""
    if LOGO_TRACKED:
        return text.replace("#", "")

    def hide(m):
        tags = re.findall(r"\\alpha&H[0-9A-F]{2}&(?:\\t\([^)]*\))?", text[:m.start()])
        restore = tags[-1] if tags else r"\alpha&H00&"
        return rf"{{\alpha&HFF&}}{m.group(1)}{{{restore}}}"
    return re.sub(r"#(.)", hide, text)


def event(layer, f0, f1, tags, text):
    return f"Dialogue: {layer},{ts(f0)},{ts(f1)},Glitch,,0,0,0,,{{{tags}}}{censor(text)}"


def notches(y, rows):
    """Random resting slices relative to the anchor: [(top, bottom, dx)]."""
    return [(a - y, b - y, rng.choice([-4, -3, 3, 4])) for a, b in bands(2 * rows, 4, y, rows)]


def rest(f0, f1, text, y, rows, base, accent, x=X, cuts=None):
    """Calm caption with notched slices (`cuts` keeps the same slices on a moving caption)."""
    painted = paint(text, base, accent)
    cuts = cuts or notches(y, rows)
    strips = [(y + a, y + b) for a, b, _ in cuts]
    out = [event(2, f0, f1, rf"\an2\pos({x},{y})\1c{base}\iclip({clip_path(strips)})", painted)]
    for (a, b), (_, _, dx) in zip(strips, cuts):
        out.append(event(3, f0, f1, rf"\an2\pos({x + dx},{y})\1c{base}\clip(0,{a},{W},{b})", painted))
    return out


def burst_frame(f, text, y, rows, base, accent, x=X):
    """One frame of a glitch burst. Echoes are flat colour; the main copy keeps its accents."""
    plain = text.replace("*", "")
    scale = rng.randint(110, 128)
    dx, dy = rng.randint(-6, 6), rng.randint(-3, 2)
    burst_params[f] = (scale / 100, dx, dy)
    main_fill, main_bord = rng.choice(
        [(GOLD_C, OBSIDIAN), (OBSIDIAN, AMETHYST), (base, OBSIDIAN)]
    )
    painted = paint(text, main_fill, accent)
    echo = rng.choice([-1, 1]) * rng.randint(6, 10)
    size = rf"\fscx{scale}\fscy{scale}"
    strips = bands(3 * rows, 7, y, rows)
    out = [
        event(0, f, f + 1, rf"\an2\pos({x + dx + echo},{y + dy + 2}){size}\1c{ECHO}\3c{ECHO}", plain),
        event(1, f, f + 1, rf"\an2\pos({x + dx - echo // 2},{y + dy + 3}){size}\1c{OBSIDIAN}", plain),
        event(2, f, f + 1,
              rf"\an2\pos({x + dx},{y + dy}){size}\1c{main_fill}\3c{main_bord}\iclip({clip_path(strips)})", painted),
    ]
    for a, b in strips:
        sx = rng.choice([-1, 1]) * rng.randint(5, 12)
        out.append(event(3, f, f + 1,
                         rf"\an2\pos({x + dx + sx},{y + dy}){size}\1c{main_fill}\3c{main_bord}\clip(0,{a},{W},{b})",
                         painted))
    return out


# Captions in frames; text is upper-cased but keeps *accent* markup
words = []
for line in LINES:
    for c in captions(*line):
        c.f0, c.f1 = round(c.t0 * FPS), round(c.t1 * FPS)
        c.text, c.after = c.text.upper(), [a.upper() for a in c.after]
        c.tracked = TRACKED and "#" in c.text
        if c.tracked:
            c.f1 = round(TRACK_UNTIL * FPS)  # ride the zoom until it has left the frame
        if LOGO_TRACKED and "#" in c.text:
            c.logo_f1 = round(TRACK_UNTIL * FPS)  # the logo stays on the figure until the cut
        words.append(c)

# Global burst schedule (frame -> True) independent of word boundaries
burst = set()
for c in words:
    if c.first:
        burst.update(range(c.f0, c.f0 + ENTRY_FRAMES))
f = words[0].f0
while f < words[-1].f1:
    f += round(rng.uniform(*GAP) * FPS)
    burst.update(range(f, f + rng.randint(*BURST_FRAMES)))

def reveal_starts(c):
    """ms offset at which each word starts fading in.

    The gap after a word has landed is (REVEAL_STEP - REVEAL_FADE) per "+";
    with "<" the first word lands instantly, with "%" every word does (it glitches in).
    """
    gap = c.reveal * (REVEAL_STEP - REVEAL_FADE)
    fade = 0 if c.glitch_in else REVEAL_FADE
    starts, landed = [], 0
    for i in range(len(re.split(r" |\\N", c.text))):
        if i == 0:
            starts.append(0)
            landed = 0 if c.instant_first else fade
        else:
            starts.append(landed + gap)
            landed = starts[-1] + fade
    return starts


# Frozen captions: a hit on entry (unless fading in), then dead still (plus the flip, if any)
for c in words:
    if c.still or c.reveal:
        burst.difference_update(range(c.f0, c.f1))
        if not c.reveal:
            burst.update(range(c.f0, c.f0 + ENTRY_FRAMES))
    if c.glitch_in:
        # each word arrives on its own glitch hit
        c.appear = [c.f0 + round(s / 1000 * FPS) for s in reveal_starts(c)]
        for a in c.appear:
            burst.update(range(a, a + ENTRY_FRAMES))
    if c.flip:
        c.flip_at = (c.f0 + c.f1) // 2
        if c.reveal:
            # Flip a beat after the last word has landed
            last = reveal_starts(c)[-1] / 1000
            last += ENTRY_FRAMES / FPS if c.glitch_in else REVEAL_FADE / 1000
            c.flip_at = min(c.f0 + round((last + REVEAL_HOLD) * FPS), c.f1 - FLIP_FRAMES - 1)
        # every extra ">" state gets its own flip, REFLIP_HOLD after the previous one settles
        c.flips = [c.flip_at]
        for _ in c.after[1:]:
            c.flips.append(c.flips[-1] + FLIP_FRAMES + round(REFLIP_HOLD * FPS))
        for fl in c.flips:
            burst.update(range(fl, fl + FLIP_FRAMES))


def hide_pending(c, text, fr):
    """For "%" captions, keep words that haven't glitched in yet invisible (but laid out)."""
    if not c.glitch_in or fr >= c.appear[-1]:
        return text  # (">" after-text can have different words; everything is in by then)
    parts = re.split(r"( |\\N)", text)
    words_ = [w if a <= fr else rf"{{\alpha&HFF&}}{w}{{\alpha&H00&}}"
              for w, a in zip(parts[::2], c.appear)]
    return "".join(w + sep for w, sep in zip(words_, parts[1::2] + [""]))


def fade_in_words(c, text):
    """Prefix each word with its alpha fade (spaces and row breaks split words)."""
    parts = re.split(r"( |\\N)", text)
    out = []
    for i, (word, a) in enumerate(zip(parts[::2], reveal_starts(c))):
        if i == 0 and c.instant_first:
            out.append(word)
        else:
            out.append(rf"{{\alpha&HFF&\t({a},{a + REVEAL_FADE},\alpha&H00&)}}{word}")
    return "".join(w + sep for w, sep in zip(out, parts[1::2] + [""]))


def faded_words_at(c, text, fr):
    """fade_in_words frozen at frame fr, for captions drawn one event per frame."""
    ms = (fr - c.f0) * 1000 / FPS
    parts = re.split(r"( |\\N)", text)
    out = []
    for i, (word, a) in enumerate(zip(parts[::2], reveal_starts(c))):
        p = 1.0 if i == 0 and c.instant_first else min(1.0, max(0.0, (ms - a) / REVEAL_FADE))
        out.append(rf"{{\alpha&H{round(255 * (1 - p)):02X}&}}{word}")
    return "".join(w + sep for w, sep in zip(out, parts[1::2] + [""]))


def flips_done(c, fr):
    """How many flips a "^" caption has gone through at frame fr. Each flip flickers
    new, old, new, new... and then stays on the new state."""
    n = 0
    for fl in getattr(c, "flips", []):
        k = fr - fl
        if k >= 0 and (k >= FLIP_FRAMES or k != 1):
            n += 1
    return n


def swapped(c, fr):
    """True while a "^" caption's colours are swapped (after an odd number of flips)."""
    return flips_done(c, fr) % 2 == 1


def state(c, fr):
    """(text, base, accent) at frame fr; each flip swaps colours and moves to the next text."""
    n = flips_done(c, fr)
    text = c.after[n - 1] if n else c.text
    return (text, GOLD_C, AMETHYST) if n % 2 else (text, AMETHYST, GOLD_C)


def spin_angle(c, fr):
    """Logo rotation (degrees, clockwise) at frame fr: from the first flip it spins
    SPIN_TURNS turns, easing out over SPIN_DUR, and lands 0.14 of a turn off square."""
    if not getattr(c, "flips", None) or fr < c.flips[0]:
        return 0.0
    p = min(1.0, (fr - c.flips[0]) / (SPIN_DUR * FPS))
    return 360 * SPIN_TURNS * (1 - (1 - p) ** 3)


def logo_filter(censored):
    """ffmpeg filtergraph: burn glitch.ass into [0:v], then put the logo ([1:v]) over each
    hidden letter. It fades in with a "+" caption, follows burst jitter/scale, and spins
    into place when the caption flips."""
    base = round(CENSOR_SIZE * LOGO_BORDER)
    # per frame (x, y, size, angle), merged into runs: (first, last, x, y, size, angle, fade_s)
    shots = []
    for c in censored:
        for fr in range(c.f0, getattr(c, "logo_f1", c.f1)):
            if LOGO_TRACKED:
                # the logo alone sits on the tracked scene point; the caption stays centred
                tx, ty = track_point(fr)
                look = (round(tx), round(ty), base, round(spin_angle(c, fr), 1))
                if shots and shots[-1][1] == fr - 1 and shots[-1][2:6] == look:
                    shots[-1] = (shots[-1][0], fr, *look, shots[-1][6])
                else:
                    fade = fr / FPS if c.reveal and not c.glitch_in and fr == c.f0 else None
                    shots.append((fr, fr, *look, fade))
                continue
            x, y = c.anchor(fr)
            cx, cy = x + CENSOR_OFFSET[0], y + CENSOR_OFFSET[1]
            if fr in burst_params:
                s, dx, dy = burst_params[fr]
                look = (round(x + dx + (cx - x) * s), round(y + dy + (cy - y) * s),
                        round(base * s), round(spin_angle(c, fr), 1))
            else:
                look = (cx, cy, base, round(spin_angle(c, fr), 1))
            if shots and shots[-1][1] == fr - 1 and shots[-1][2:6] == look:
                shots[-1] = (shots[-1][0], fr, *look, shots[-1][6])
            else:
                # the text's fade clock starts at the event, i.e. on frame f0
                fade = fr / FPS if c.reveal and not c.glitch_in and fr == c.f0 else None
                shots.append((fr, fr, *look, fade))

    frame = "crop=ih*9/16:ih,scale=1080:1920:flags=lanczos,setsar=1," if SHORTS else ""
    lines = [f"[0:v]{frame}ass=glitch{SUFFIX}.ass:fontsdir=.[v0]",
             f"[1:v]format=rgba,split={len(shots)}" + "".join(f"[l{i}]" for i in range(len(shots)))]
    for i, (a, b, x, y, size, angle, fade) in enumerate(shots):
        # captions are scaled by libass; the logo overlay is placed in output pixels
        x, y, size = round(x * OUT_SCALE), round(y * OUT_SCALE), round(size * OUT_SCALE)
        chain = f"scale={size}:{size}"
        if angle:
            chain += f",rotate=a={math.radians(angle):.5f}:ow=hypot(iw\\,ih):oh=ow:c=none"
        if fade is not None:
            chain += f",fade=t=in:st={fade:.3f}:d={REVEAL_FADE / 1000}:alpha=1"
        lines.append(f"[l{i}]{chain}[s{i}]")
        # centre on (x, y) whatever size the rotated canvas ended up
        lines.append(f"[v{i}][s{i}]overlay=x={x}-overlay_w/2:y={y}-overlay_h/2"
                     f":shortest=1:enable='between(n,{a},{b})'[v{i + 1}]")
    lines[-1] = lines[-1].rsplit("[", 1)[0] + "[out]"
    return ";\n".join(lines) + "\n"


events = []
censored = []
for c in words:
    # Multi-row captions grow upward from \an2, so drop the anchor to keep the block centred,
    # or (with "=") far enough that the top row sits where a single word would
    rows = c.text.count(r"\N") + 1
    y = Y + round((rows - 1) * LINE_H * (1 if c.top_centred else 0.5))
    if LOWER_FROM - 0.01 <= c.t0 < LOWER_UNTIL - 0.01:
        y += LOWER_BY
    if "#" in c.text:
        censored.append(c)

    if c.tracked:
        # anchor so the censored letter sits on the tracked point
        def anchor(fr):
            tx, ty = track_point(fr)
            return round(tx - CENSOR_OFFSET[0]), round(ty - CENSOR_OFFSET[1])
        c.anchor = anchor
        cuts = notches(y, rows)  # same resting slices all the way down
        for fr in range(c.f0, c.f1):
            ax, ay = anchor(fr)
            text, base, accent = state(c, fr)
            if fr in burst:
                events += burst_frame(fr, hide_pending(c, text, fr), ay, rows, base, accent, x=ax)
            else:
                if c.reveal and not c.glitch_in:
                    text = faded_words_at(c, text, fr)
                events += rest(fr, fr + 1, hide_pending(c, text, fr), ay, rows, base, accent,
                               x=ax, cuts=cuts)
        continue

    c.anchor = lambda fr, y=y: (X, y)
    # Split the caption's span into calm runs and burst frames
    run = c.f0
    for fr in range(c.f0, c.f1 + 1):
        if fr == c.f1 or fr in burst:
            if fr > run:
                text, base, accent = state(c, run)
                if c.reveal and not c.glitch_in and run == c.f0:
                    text = fade_in_words(c, text)
                events += rest(run, fr, hide_pending(c, text, run), y, rows, base, accent)
            if fr < c.f1:
                text, base, accent = state(c, fr)
                events += burst_frame(fr, hide_pending(c, text, fr), y, rows, base, accent)
            run = fr + 1

header = rf"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Glitch,Retron2000,{SIZE},&H00F65C8B,&H00F65C8B,&H000F0A0A,&H00000000,0,0,0,0,100,100,1,0,1,3,0,2,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
out = Path(__file__).with_name(f"glitch{SUFFIX}.ass")
out.write_text(header + "\n".join(events) + "\n")
Path(__file__).with_name(f"glitch{SUFFIX}.filter").write_text(logo_filter(censored))
print(len(words), "words,", len(burst), "burst frames,", len(events), "events,",
      len(censored), "censored")
