import re
from pathlib import Path

LINES = [
    (0.00, 2.30, "I've built sbozh.me to get you sbozhed."),
    (2.30, 4.50, "For this, I had to take my mask off."),
    (4.50, 6.80, "And here's what I've found."),
    (6.80, 9.20, "LOOK HOW BIG MY EGO IS."),
    (9.20, 13.80, "I've become your EMPEROR."),
    (15.40, 19.90, "But for your comfort, I can appear like this."),
    (20.00, 22.00, "I've killed myself 16 times."),
    (22.00, 23.90, "For the 17th, I need an audience."),
    (23.90, 25.50, "And you can't run away from me."),
    (25.50, 27.20, "We are locked here together forever."),
    (27.20, 30.80, "I will go deep inside of you, to see what you are made of."),
    (30.80, 33.00, "I will make you stay naked in front of me."),
    (33.00, 34.60, "And wait for my Dick Pitch."),
    (34.60, 36.80, "And there are only us to see it."),
    (36.92, 38.20, "Didn't get it?"),
    (38.20, 39.88, "We've got plenty of time."),
]
GOLD = {"EGO", "EMPEROR"}


def ts(t):
    cs = round(t * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


events = []
for start, end, text in LINES:
    words = text.split()
    # Longer words stay a bit longer; the constant keeps short words readable
    weights = [len(re.sub(r"\W", "", w)) + 3 for w in words]
    total = sum(weights)
    t = start
    for w, weight in zip(words, weights):
        t2 = t + (end - start) * weight / total
        body = w
        if re.sub(r"\W", "", w) in GOLD:
            body = r"{\c&H0B9EF5&}" + w
        pop = r"{\fscx118\fscy118\t(0,90,\fscx100\fscy100)}"
        events.append(f"Dialogue: 0,{ts(t)},{ts(t2)},Word,,0,0,0,,{pop}{body}")
        t = t2

header = r"""[Script Info]
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
out = Path(__file__).with_name("words.ass")
with out.open("w") as f:
    f.write(header + "\n".join(events) + "\n")
print(len(events), "words")
