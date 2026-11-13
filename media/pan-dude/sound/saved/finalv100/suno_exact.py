"""Version B of the Suno cut: every line of the script, exactly in its caption window.

Where suno_cut.py (version A) drops what doesn't fit, this one keeps everything and speeds
it up instead. It works on stems (Demucs htdemucs, --two-stems=vocals):
  - each WINDOW (picture start, picture end) takes the Suno vocal between two source times,
  - pauses inside it are removed using the vocal stem's own activity (exact edges),
  - it is time-compressed (pitch kept) to fill its window exactly, never slowed down,
  - the instrumental stem plays underneath continuously, so the beat never jumps,
  - censored words are bleeped (the picture says CENSORED).

Usage: FFMPEG=... python suno_exact.py STEMS_DIR [name] [video.mp4 ...]
       STEMS_DIR holds vocals.wav and no_vocals.wav from Demucs
       -> <name>.wav, plus <video>-<name>.mp4 next to each video (picture copied)
"""

import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.io import wavfile
from scipy.signal import resample_poly

HERE = Path(__file__).parent
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
STEMS = Path(sys.argv[1])
NAME = sys.argv[2] if len(sys.argv) > 2 else "suno-B"
VIDEOS = [Path(v) for v in sys.argv[3:]]
SR = 48000
DUR = 39.88
BED_FROM = 6.5  # where the instrumental stem starts under the picture
BED_GAIN = float(os.environ.get("BED_GAIN", "0.55"))  # 0: voice only
GAP_MIN = 0.15  # pauses this long inside a phrase are cut...
GAP_KEEP = 0.05  # ...down to this
XF = 0.012  # crossfade at every internal cut
REL_DB = 24  # quieter than the phrase's peak by this much counts as a pause
LAG = float(os.environ.get("LAG", "0.20"))  # the voice follows its caption by this much (reading time)
# lines that keep their caption timing: the run-up to the 25th-frame hole (19.90) and the very end,
# where a lag would only squeeze them faster; the line before them ends where they start
NO_LAG = {"You need to know", "To know, you need", "Do we?"}
# finished-level one-shots: (picture time before LAG, file, peak)
# lines ending in "us": the final "us" (source start) is played whole at x1.0, landing where it did,
# and rings on past the window over the next line instead of being squeezed
US_TAIL = {"your EMPEROR, EMPEROR, IMPERIUM for us": 38.90, "Only us": 45.64}
# a character voice over part of the vocal (env VOICE_FX picks one; none = plain)
FX = {
    # +7 semitones, wobbly vibrato, a bit of honk
    "clown": "asetrate=48000*1.5,aresample=48000,atempo=1/1.5,vibrato=f=6:d=0.35,equalizer=f=1800:t=q:w=1:g=5",
    # +9 semitones, fast throat flutter, thin and nasal like a crow
    "rooster": "asetrate=48000*1.68,aresample=48000,atempo=1/1.68,vibrato=f=11:d=0.6,tremolo=f=14:d=0.35,"
               "highpass=f=500,equalizer=f=2600:t=q:w=0.8:g=8",
    # -5 semitones, chest boost, a hall around it
    "emperor": "asetrate=48000*0.75,aresample=48000,atempo=1/0.75,equalizer=f=150:t=q:w=1:g=6,"
               "aecho=0.8:0.6:60|110:0.35|0.25",
    # --- Emperor alternatives (env EMPEROR picks one) ---
    # much lower, darker, longer echo
    "emperor-dark": "asetrate=48000*0.63,aresample=48000,atempo=1/0.63,lowpass=f=3500,equalizer=f=120:t=q:w=1:g=7,"
                    "aecho=0.8:0.7:80|160|260:0.4|0.3|0.2",
    # a choir of one: the voice plus itself an octave down, in a big hall
    "emperor-god": "asplit[a][b];[b]asetrate=48000*0.5,aresample=48000,atempo=2.0,volume=0.9[lo];"
                   "[a]asetrate=48000*0.84,aresample=48000,atempo=1/0.84[hi];[hi][lo]amix=inputs=2:normalize=0,"
                   "aecho=0.8:0.8:90|170|310|470:0.45|0.35|0.25|0.15",
    # slow and close: lower, slightly dragged vibrato, almost dry
    "emperor-whisper": "asetrate=48000*0.8,aresample=48000,atempo=1/0.8,highpass=f=90,equalizer=f=4000:t=q:w=1:g=5,"
                       "vibrato=f=3:d=0.15",
}
VOICE_FX = os.environ.get("VOICE_FX", "clown")  # picked 2026-11-13; VOICE_FX= for plain
# per-line voice, applied to the line itself, so it keeps its echo tail even when it overlaps others
LINE_FX = {"To know, you need": os.environ.get("EMPEROR", "emperor-god")}
FULL_SPEED = {"To know, you need"}  # never sped up or cut to the window: rings on over what follows
FX_SPANS = [
    (16.75, 19.17, VOICE_FX),  # "I can appear even like this", "You need to know"
    # try copy: WHOLE=<fx> gives the rest of the voice that voice too (the clown span stays clown)
    (0.0, 16.75, os.environ.get("WHOLE", "")),
    (20.10, DUR, os.environ.get("WHOLE", "")),
]
SFX = [
    (6.15, "got-ai.wav", 0.75),  # AI "GOT" right after "found"
]

# (picture start, picture end, Suno source from, Suno source to, text)
WINDOWS = [
    # only "dot" (source 8.36-8.65) removed: "I've built zbozh | me, to get you zbozhd"
    (0.05, 0.80, 6.80, 8.36, "I've built zbozh"),
    (0.80, 2.30, 8.65, 13.80, "me, to get you zbozhd"),
    (2.30, 4.50, 14.40, 20.90, "For this, I had to take my mask off"),
    (4.50, 6.80, 21.40, 23.75, "And here's what I've found"),
    (6.50, 9.55, 23.75, 28.60, "Look how big my ego is"),  # was 6.80-9.20; heard to 9.75, over "I've become" on purpose
    (7.80, 9.90, 28.60, 31.60, "I've become"),  # was 9.20-9.90; heard from 8.00
    # one unbroken run, "your emperor, (no) emperor, Imperium for us" (was 3 cut windows from 10.21 to 13.08)
    (9.95, 13.40, 31.60, 39.40, "your EMPEROR, EMPEROR, IMPERIUM for us"),
    (13.40, 14.60, 42.10, 44.05, "There is no you, no me"),  # was 13.08-14.40
    (14.60, 15.40, 44.10, 46.60, "Only us"),  # was 14.40-15.40
    (15.40, 16.67, 49.80, 50.90, "But for your comfort"),
    (16.67, 18.40, 50.90, 54.50, "I can appear even like this"),
    (18.40, 19.17, 55.50, 57.05, "You need to know"),
    (19.17, 19.90, 57.05, 60.40, "To know, you need"),
    (20.00, 21.46, 66.70, 68.90, "I've CENSORED myself"),
    (21.46, 22.00, 74.90, 76.80, "16 times"),
    (22.00, 23.90, 76.90, 81.70, "For the 17th, I need an audience"),
    (23.90, 25.50, 84.40, 90.25, "And you can't run away from me"),
    (25.50, 27.20, 90.25, 93.65, "We are locked here together forever"),
    (27.20, 29.80, 93.65, 102.30, "I will go deep inside of you, to see what you are made of"),
    (29.80, 31.95, 102.30, 111.15, "I will make you stay naked in front of me"),
    (31.95, 32.82, 111.15, 113.92, "And wait for my"),
    (33.17, 35.35, 113.92, 117.45, "D*ck Pitch"),  # 0.35s of silence before it, as on screen
    (35.35, 36.85, 119.80, 123.55, "And there are only us to see it"),
    (36.92, 37.70, 124.80, 125.75, "Didn't get it?"),
    (37.70, 39.20, 127.50, 130.95, "Well, we have plenty of time"),
    (39.21, 39.88, 133.50, 134.20, "Do we?"),
]
CENSOR = [(67.55, 67.95)]  # "killed"
SKIP = [(34.90, 36.15)]  # "no" (of "no emperor"): silenced in the stem, so tighten() cuts it like a pause


def load(name):
    a, sr = sf.read(STEMS / name, always_2d=True)
    a = a.T
    return resample_poly(a, SR, sr, axis=1) if sr != SR else a


vocals, music = load("vocals.wav"), load("no_vocals.wav")

# the censor goes in before anything is cut or sped up
for a, b in CENSOR:
    i0, i1 = int(a * SR), int(b * SR)
    x = np.arange(i1 - i0) / SR
    vocals[:, i0:i1] = 0.2 * np.sin(2 * np.pi * 1000 * x) * np.clip(np.minimum(x, x[-1] - x) / 0.004, 0, 1)

for a, b in SKIP:
    vocals[:, int(a * SR):int(b * SR)] = 0

# vocal activity, 10 ms frames
hop = SR // 100
mono = vocals.mean(0)
frames = len(mono) // hop
db = 20 * np.log10(np.sqrt(np.mean(mono[:frames * hop].reshape(frames, hop) ** 2, 1)) + 1e-9)
active = db > db.max() - 38


def tighten(a, b):
    """The source span a..b with its silences cut down to GAP_KEEP; returns the audio."""
    fa, fb = int(a * 100), int(b * 100)
    # judged against this phrase's own loudest moment: the stem has music bleed in places,
    # so a single global threshold hears no pauses there
    act = db[fa:fb] > db[fa:fb].max() - REL_DB
    on = np.flatnonzero(act)
    if not len(on):
        return vocals[:, int(a * SR):int(b * SR)]
    act[:on[0]] = act[on[-1] + 1:] = False  # trim both ends to the voice
    pieces, run_start, gap = [], on[0], 0
    for k in range(on[0], on[-1] + 2):
        if k <= on[-1] and act[k]:
            if gap >= GAP_MIN * 100:  # close the run before the long gap
                pieces.append((run_start, k - gap + int(GAP_KEEP * 100)))
                run_start = k
            gap = 0
        else:
            gap += 1
    pieces.append((run_start, on[-1] + 2))
    xf = int(XF * SR)
    out = np.zeros((2, 0))
    for s, e in pieces:
        seg = vocals[:, (fa + s) * hop - xf:(fa + e) * hop + xf].copy()
        seg[:, :xf] *= np.linspace(0, 1, xf)
        seg[:, -xf:] *= np.linspace(1, 0, xf)
        if out.shape[1] >= xf:
            out[:, -xf:] += seg[:, :xf]
            out = np.concatenate([out, seg[:, xf:]], axis=1)
        else:
            out = seg
    return out


def tempo(seg, speed):
    if speed <= 1.001:
        return seg
    chain = []
    while speed > 2.0:  # atempo is cleanest in 0.5..2 per stage
        chain.append("atempo=2.0")
        speed /= 2.0
    chain.append(f"atempo={speed:.5f}")
    p = subprocess.run([FFMPEG, "-v", "error", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "pipe:0",
                        "-af", ",".join(chain), "-f", "f32le", "pipe:1"],
                       input=seg.T.astype(np.float32).tobytes(), check=True, capture_output=True).stdout
    return np.frombuffer(p, np.float32).reshape(-1, 2).T.astype(np.float64)


def apply_fx(part, name, tail=0.0):
    """part through FX[name] at the same loudness; tail seconds of silence are added first for the echo."""
    src = np.pad(part, ((0, 0), (0, int(tail * SR))))
    p = subprocess.run([FFMPEG, "-v", "error", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "pipe:0",
                        "-af", FX[name], "-f", "f32le", "-ar", str(SR), "pipe:1"],
                       input=src.T.astype(np.float32).tobytes(), check=True, capture_output=True).stdout
    fx = np.frombuffer(p, np.float32).reshape(-1, 2).T.astype(np.float64)
    fx = np.pad(fx, ((0, 0), (0, max(0, src.shape[1] - fx.shape[1]))))[:, :src.shape[1]]
    fx *= np.sqrt(np.mean(part ** 2) / (np.mean(fx[:, :part.shape[1]] ** 2) + 1e-12))
    e = int(0.01 * SR)
    fx[:, :e] *= np.linspace(0, 1, e)
    fx[:, -e:] *= np.linspace(1, 0, e)
    return fx


n = int(DUR * SR)
voice = np.zeros((2, n + SR))
cover = np.zeros(n + SR)
print("  window          source         tight   speed  text")
for k, (t0, t1, a, b, text) in enumerate(WINDOWS):
    u = US_TAIL.get(text)
    seg = tighten(a, u or b)
    tail = tighten(u, b) if u else np.zeros((2, 0))
    tight = (seg.shape[1] + tail.shape[1]) / SR
    nxt = WINDOWS[k + 1] if k + 1 < len(WINDOWS) else None
    if text not in NO_LAG:
        t0, t1 = t0 + LAG, (t1 if nxt and nxt[4] in NO_LAG else t1 + LAG)
    speed = 1.0 if text in FULL_SPEED else max(1.0, tight / (t1 - t0))
    seg = tempo(seg, speed)
    if text not in FULL_SPEED:
        seg = seg[:, :int((t1 - t0) * SR)]  # exactly the window
    f = int(0.008 * SR)
    if tail.shape[1]:  # crossfade the whole "us" on, unsped
        xf = int(XF * SR)
        seg[:, -xf:] *= np.linspace(1, 0, xf)
        tail[:, :xf] *= np.linspace(0, 1, xf)
        seg = np.concatenate([seg[:, :-xf], seg[:, -xf:] + tail[:, :xf], tail[:, xf:]], axis=1)
    seg[:, -f:] *= np.linspace(1, 0, f)
    if text in LINE_FX:
        seg = apply_fx(seg, LINE_FX[text], tail=1.0)
        flag = f"  ({LINE_FX[text]}, to {t0 + seg.shape[1] / SR:.2f})"
    else:
        flag = ""
    i = int(t0 * SR)
    seg = seg[:, :voice.shape[1] - i]
    voice[:, i:i + seg.shape[1]] += seg
    cover[i:i + seg.shape[1]] = 1
    flag += "  !" if speed > 2.2 else ""
    if tail.shape[1]:
        flag += f"  (us at x1.00, rings to {t0 + seg.shape[1] / SR:.2f})"
    print(f"{t0:6.2f}-{t1:5.2f}  {a:6.2f}-{b:6.2f}  {tight:5.2f}s  x{speed:4.2f}{flag}  {text}")

for f0, f1, name in FX_SPANS:
    if not name:
        continue
    i0, i1 = int(f0 * SR), int(f1 * SR)
    fx = apply_fx(voice[:, i0:i1], name)
    voice[:, i0:i1] = fx
    print(f"voice fx {name}: {f0:.2f}-{f1:.2f}")

bed = music[:, int(BED_FROM * SR):int(BED_FROM * SR) + voice.shape[1]] * BED_GAIN
bed = np.pad(bed, ((0, 0), (0, voice.shape[1] - bed.shape[1])))
bed[:, int(19.90 * SR):int(20.00 * SR)] = 0  # the 25th frame is a hole
mix = (voice + bed)[:, :n]
mix = np.tanh(1.3 * mix / np.max(np.abs(mix))) / np.tanh(1.3) * 0.89 if BED_GAIN else mix / np.max(np.abs(mix)) * 0.89
for t, f, peak in SFX:
    g, gsr = sf.read(HERE / f, always_2d=True)
    g = g.T if gsr == SR else resample_poly(g.T, SR, gsr, axis=1)
    g = g / np.max(np.abs(g)) * peak
    i = int((t + LAG) * SR)
    mix[:, i:i + g.shape[1]] += g[:, :max(0, n - i)]
mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
wavfile.write(HERE / f"{NAME}.wav", SR, (mix.T * 32767).astype(np.int16))
print(f"-> {NAME}.wav")
for v in VIDEOS:
    o = v.with_name(f"{v.stem}-{NAME}.mp4")
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(v), "-i", str(HERE / f"{NAME}.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", str(o)], check=True)
    print(f"built {o}")
