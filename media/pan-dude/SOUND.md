# Pan Dude Reel: sound work (handoff)

Notes for continuing the Reel's sound. `suno_exact.py`, this file and `sound/` scripts are in git;
audio/video and stems stay local (git-ignored).

## FINAL: finalv100 (2026-11-13)

**`media/production/live/sbozhme_pan-dude-reels-finalv100.mp4`** (also in `sound/saved/finalv100/` with `finalv100.wav`).
`suno_exact.py` (working copy) == `sound/saved/finalv100/suno_exact.py`; both rebuild `finalv100.wav` byte-identical:
`FFMPEG=… python suno_exact.py _work/stems-song1 finalv100`. Its candidates are listed below, newest last.
"To know, you need" is `emperor-god` via `LINE_FX`, at x1.00 via `FULL_SPEED`, ringing to ~23.55.

## Saves and experiments: `sound/` (see `sound/README.md`)
Current state frozen in `sound/saved/2026-11-13-clown-deep/` (rebuilds byte-identical). Emperor-voice trials in `sound/try/emperor-voice/`.

## The approved state (2026-11-13)

**`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B.mp4`**

| Part | What | Built by |
|---|---|---|
| Picture | 1080x1920 full 9:16 crop (no blur bands), Archivo Black, `tracked` captions: D✳CK PITCH. rides down the figure | `glitch.py` in the **kagurame-animation worktree**, not main |
| Sound | Version B: Suno take 1, every caption window filled exactly, voice sped up to fit, instrumental stem underneath, "killed" bleeped | `suno_exact.py` → `suno-B.wav` |

The sound reference is `media/production/live/sbozhme_pan-dude-live-uncensored-shorts-suno-B.mp4`,
which the user picked. The Reel's audio was stream-copied from it, so the MD5 of the decoded audio matches.

### Rebuild the picture
```bash
cd .claude/worktrees/kagurame-animation/media/pan-dude
FONT=archivo VARIANT=tracked FORMAT=shorts python3 glitch.py   # writes glitch-tracked-shorts.ass/.filter
$FFMPEG -i sbozhme_pan-dude-25th-frame.mp4 -framerate 24 -loop 1 -i logo-outlined.png -i <SOUND.wav|.mp4> \
  -filter_complex_script glitch-tracked-shorts.filter -map "[out]" -map 2:a -t 39.88 -r 24 \
  -c:v libx264 -crf 18 -preset slow -profile:v high -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart OUT.mp4
```
Only change the **sound** of an existing Reel without re-rendering the picture (about 1s):
```bash
$FFMPEG -i REEL.mp4 -i NEW.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart OUT.mp4
```

Pitfalls the user hit:
- **Font:** main's `glitch.py` only knows Retron2000. The post and the Reel use **Archivo Black** from the
  worktree's `glitch.py` (`FONT=archivo`). Don't render captions from main.
- **Variant:** `tracked` (censored, the caption rides the figure) is right; `logo-tracked` (DICK uncensored,
  only the ✳ moves) is wrong for this Reel.
- **Framing:** `FORMAT=shorts` crops. The old `*-archivo-uncensored-v3-shorts.mp4` has blurred bands, so don't use it.

### Candidate: no "dot" (2026-11-13, awaiting pick)
`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B-nodot.mp4` (sound: `suno-B-nodot.wav`).
Only "dot" (source 8.36-8.65) is cut. `suno_exact.py`'s first window is split into `(0.05, 0.80, 6.80, 8.36)`
"I've built zbozh" x1.93 and `(0.80, 2.30, 8.65, 13.80)` "me, to get you zbozhd" x1.94. To restore B,
put back the single row `(0.05, 2.30, 6.80, 13.80)`.

### Candidate: no "dot" + AI "GOT" (2026-11-13, awaiting pick)
`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B-nodot-got.mp4` (sound: `suno-B-nodot-got.wav`).
macOS `say -v Samantha -r 170 "Got."`, silence trimmed (`got-ai.wav`, 0.26s), peak 0.75, mixed at 6.15s,
right after "found" ends (~6.10) and before "Look" (6.80). Rebuild: run `suno_exact.py` → `suno-B-nodot.wav`, then add it.

### Candidate: + reading lag (2026-11-13, awaiting pick)
`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B-nodot-got-lag.mp4` (sound: `suno-B-nodot-got-lag.wav`).
`suno_exact.py` now has `LAG` (env, default 0.20s): every voice window starts and ends 0.20s after its caption,
so you read first and then hear it. `NO_LAG` keeps "You need to know", "To know, you need" (before the 19.90 hole)
and "Do we?" (the end) on caption time; the line before each of them ends where they start, so "I can appear"
goes x1.72 and "Well, we have plenty" x1.33. `SFX` mixes `got-ai.wav` at 6.15+LAG at the finished level.
`LAG=0` reproduces the no-lag version, with GOT included.

### Rejected: robot comfort line (2026-11-13)
Replacing 15.60-19.90 with a Samantha "Your comfort... I can appear like this" (`comfort-ai.wav`,
`…-suno-B-robot.mp4`): the user didn't like it. Reverted; the Suno lines are back in `WINDOWS`.

### Candidate: early "I've become" (2026-11-13, awaiting pick)
`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B-become.mp4` (sound: `suno-B-become.wav`).
On top of the lag version: "Look how big my ego is" is heard 6.70-9.00 (x1.68) and "I've become" 8.00-10.10 (x1.08).
The two overlap 8.00-9.00 on purpose (the user asked for it). The `WINDOWS` rows note the old times.

### Candidate: whole "us" + longer ego line (2026-11-13, awaiting pick)
`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B-us.mp4` (sound: `suno-B-us.wav`).
On top of "become": `US_TAIL` plays the final "us" of "IMPERIUM for us" (rings to 13.49) and "Only us" (to 15.93)
whole at x1.00, over the start of the next line. "Look how big my ego is" is heard 6.70-9.75 (x1.27),
overlapping "I've become" (8.00-10.10).

### Candidate: unbroken Emperor run (2026-11-13, awaiting pick)
`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B-emperor.mp4` (sound: `suno-B-emperor.wav`).
On top of "us": "your EMPEROR / EMPEROR / IMPERIUM for us" is one window, 10.15-13.60 at x1.68, from source 31.60-39.40.
`SKIP` silences "no" (34.90-36.15) so it's cut like a pause; the whole phrase with "no" would need x2.03.
"There is no you, no me" is now 13.60-14.80 (x1.65), and "Only us" 14.80-15.60 (x1.89, us rings to 16.04).

### Candidates: clown / rooster voice 16.75-20.10 (2026-11-13, awaiting pick)
`…-suno-B-clown.mp4` and `…-suno-B-rooster.mp4` (sounds `suno-B-clown.wav`, `suno-B-rooster.wav`) are the emperor
version with `VOICE_FX=clown|rooster`. Only the voice in `FX_SPAN` ("I can appear even like this" through "To know, you need")
goes through the `FX` ffmpeg chain, at the same loudness: clown = +7 st, 6 Hz vibrato, honk at 1.8k; rooster = +9 st,
11 Hz vibrato, 14 Hz tremolo, highpass 500, nasal +8 dB at 2.6k. Without `VOICE_FX` it reproduces `suno-B-emperor.wav` exactly.

### Current pick: clown + deep Emperor (2026-11-13)
`media/production/live/sbozhme_pan-dude-reels-archivo-tracked-suno-B-clown-deep.mp4` (sound: `suno-B-clown-deep.wav`).
`FX_SPANS`: clown on 16.75-19.17 ("I can appear even like this", "You need to know") and `emperor` on 19.17-20.10
("To know, you need"): -5 st, +6 dB at 150 Hz, echo at 60/110 ms. `VOICE_FX` now defaults to `clown`, so a plain run
reproduces this. (`…-rooster-deep.mp4` is the same with rooster.)

## Sources (all in `media/pan-dude/`, ignored)

| File | What |
|---|---|
| `Imperium For Us.mp3` | Suno take 1 (2:30). **The source of B.** Also in ~/Downloads |
| `Imperium for Us 2.mp3` | Suno take 2 (2:22): faster delivery, its 0:17-0:55 is "and here's what I've found" through "to know you need" |
| `_work/stems-song1/{vocals,no_vocals}.wav` | Demucs htdemucs 2-stem split of take 1 (44.1 kHz) |
| `_work/stems-song2/{vocals,no_vocals}.wav` | the same for take 2 |
| `_work/song1-words-whisper.json` | faster-whisper small.en word times, take 1 ([start, end, word]) |
| `_work/song1-words-tight.json` | the same, with edges tightened on the vocal stem |
| `_work/song2-words-whisper.json` | Whisper word times, take 2 |

Whisper puts the silence before a word inside that word (e.g. take 1 "16" = 71.76-75.65, but the voice is at
about 75.2). Trust the stem edges, not the Whisper starts. Take 1's vocal stem has music bleed from 84 to 115s,
so pause detection there needs the per-phrase threshold (`REL_DB`).

## Scripts (all in `media/pan-dude/`, ignored)

| Script | Makes | Status |
|---|---|---|
| `suno_exact.py` | **Version B**: `WINDOWS` = (picture start, picture end, take-1 from, take-1 to, text). Each window's voice comes from the vocal stem, pauses are cut (`REL_DB` 24 under the phrase peak, `GAP_MIN` 0.15s → `GAP_KEEP` 0.05s), it's sped up (atempo, pitch kept) to fill the window exactly, and the `no_vocals` stem runs from `BED_FROM`=6.5s at `BED_GAIN`=0.55. `CENSOR` bleeps source ranges. | **current** |
| `suno_cut.py` | Version A: `EDL` rows lifted from the full mix, max 1.35x, drifts late, drops what doesn't fit, `!` = hard anchor | alternative |
| `suno_mix.py` | A with take 2 for 6.8-20s (5th column `2`), B voice-only opening (`PREFIX_WAV`, `PREFIX_UNTIL`) | alternative |
| `voice.py` | Kokoro TTS performance (demon/rooster) | rejected |
| `audio.py` | synthesised score (17-EDO drone etc.); has an unfixed caption-lookup bug | rejected |

Rebuild B (deterministic; reproduces `suno-B.wav`):
```bash
cd media/pan-dude
FFMPEG=$FFMPEG $PY suno_exact.py _work/stems-song1 suno-B-v2 [video.mp4 ...]   # BED_GAIN=0 → voice only
```

## B's windows (picture time ← take 1 source) and speeds

```
 0.05- 2.30 ← 6.80- 13.80  x2.05  I've built zbozh dot me, to get you zbozhd
 2.30- 4.50 ← 14.40- 20.90 x1.23  For this, I had to take my mask off
 4.50- 6.80 ← 21.40- 23.75 x1.00  And here's what I've found
 6.80- 9.20 ← 23.75- 28.60 x1.61  Look how big my ego is
 9.20- 9.90 ← 28.60- 31.60 x3.25  I've become
10.21-11.54 ← 31.60- 34.90 x1.92  your EMPEROR
11.54-12.17 ← 36.15- 37.15 x1.64  EMPEROR (for us)
12.17-13.08 ← 37.60- 39.40 x1.85  IMPERIUM for us
13.08-14.40 ← 42.10- 44.05 x1.50  There is no you, no me
14.40-15.40 ← 44.10- 46.60 x1.45  Only us
15.40-16.67 ← 49.80- 50.90 x1.00  But for your comfort
16.67-18.40 ← 50.90- 54.50 x1.52  I can appear even like this       (rooster arrives 16.9)
18.40-19.17 ← 55.50- 57.05 x2.06  You need to know
19.17-19.90 ← 57.05- 60.40 x4.64  To know, you need                 (flash 19.90-20.00: silence)
20.00-21.46 ← 66.70- 68.90 x1.19  I've [bleep] myself              (CENSOR 67.55-67.95 = "killed")
21.46-22.00 ← 74.90- 76.80 x2.97  16 times
22.00-23.90 ← 76.90- 81.70 x1.71  For the 17th, I need an audience
23.90-25.50 ← 84.40- 90.25 x3.68  And you can't run away from me
25.50-27.20 ← 90.25- 93.65 x2.02  We are locked here together forever
27.20-29.80 ← 93.65-102.30 x3.34  I will go deep inside of you, ...
29.80-31.95 ←102.30-111.15 x4.13  I will make you stay naked in front of me   (tunnel fall)
31.95-32.82 ←111.15-113.92 x3.22  And wait for my
33.17-35.35 ←113.92-117.45 x1.00  D*ck Pitch                        (0.35s silence before)
35.35-36.85 ←119.80-123.55 x2.00  And there are only us to see it
36.92-37.70 ←124.80-125.75 x1.03  Didn't get it?                    (cut to the hooded man)
37.70-39.20 ←127.50-130.95 x1.15  Well, we have plenty of time
39.21-39.88 ←133.50-134.20 x1.04  Do we?
```

## Recipes for the next edits

**Remove "zbozh dot me"** (or any words): split the window's source range around the words, using
`_work/song1-words-tight.json`. Take 1's opening words (stem edges):
`I've 6.93-7.39 · built 7.38-7.73 · zbozh 7.72-8.37 · dot 8.36-8.65 · me 8.64-9.12 · to ~11.6-11.87 · get 11.86-12.13 · you 12.12-12.51 · zbozhd 12.50-13.76`.
For example, keep "I've built… to get you zbozhd" as two windows: `(0.05, 1.00, 6.80, 7.73)` and `(1.00, 2.30, 11.50, 13.80)`.
The speed follows automatically. A window can also simply be deleted: it's then silent and the bed plays.

**Add a sound at a moment:** put the WAV in `media/pan-dude/` and mix it onto the finished track:
```bash
$FFMPEG -i suno-B.wav -i sfx.wav -filter_complex "[1]adelay=33170|33170,volume=0.8[s];[0][s]amix=inputs=2:normalize=0" -ar 48000 OUT.wav
```
(adelay is in ms, per channel). Or extend `suno_exact.py` with an `SFX = [(time, file, gain)]` list.

**Change a line's speed or timing:** edit its `WINDOWS` row. A longer picture window means a slower voice.
Scene times that must stay fixed: 10.21 (Emperor), 16.67 (rooster), 19.90 (flash, a 0.1s hole), 33.17 (D✳ck),
36.92 (cut). Caption times come from `words.py` / `glitch.py` (run `glitch.py` and read `caps[i].f0/24`, `flips`).

**Use take 2 for a line:** see `suno_mix.py`: a 5th column `2` with take-2 source times
(`_work/song2-words-whisper.json`; its stem edges are in that script's rows).

## Tools (the scratchpad versions are gone with the session; reinstall)

- ffmpeg 6 with libass: not on PATH. `npm i ffmpeg-static` into any folder and use `node_modules/ffmpeg-static/ffmpeg`.
- Python ≥ 3.10 (system Python is 3.9): `pip install uv && uv venv -p 3.12 .venv && uv pip install numpy scipy soundfile demucs faster-whisper`.
  - stems: `python -m demucs --two-stems=vocals -n htdemucs -d mps -o OUT song.wav` (about 45s on the M3)
  - word times: `faster_whisper.WhisperModel("small.en", compute_type="int8")`, `transcribe(..., word_timestamps=True)`.
    Pass a decoded float32 array (16 kHz mono via ffmpeg); the bundled PyAV rejects the mp3 path.
- Picture inputs in the worktree's `media/pan-dude/`: `sbozhme_pan-dude-25th-frame.mp4`, `logo-outlined.png`, `ArchivoBlack-Regular.ttf`.

## Other renders in `media/production/live/` (ignored *.mp4)

| File | What |
|---|---|
| `…-reels-archivo-tracked-suno-B.mp4` | **approved** |
| `…-reels-archivo-suno-B.mp4` | B sound, wrong caption variant (logo-tracked) |
| `…-reels-archivo-suno-A.mp4`, `-suno-A-voice.mp4` | Version A, with music / voice only |
| `…-reels-archivo-suno-mix.mp4`, `-suno-mix-b.mp4` | two-song mixes |
| `…-reels-archivo-suno2.mp4` | take 2's 0:17-0:55 laid on unedited |
| `…-reels-suno-A*.mp4` (no "archivo") | Retron2000/DebugNotPayed font experiments: wrong font |
| `…-live-*-suno-A/B/…`, `-voice-v*` | the landscape/old-short videos with each sound version |
| `sbozhme_pan-dude-live-{glitch-tracked-web,uncensored-shorts}.mp4` | silent originals downloaded from sbozh.me (the post's current videos) |
