# sound/ (git-ignored)

Saved states and experiments for the Pan Dude Reel sound. Scripts and notes are in git; audio and video stay local. The working copy stays in `media/pan-dude/suno_exact.py`;
see `../SOUND.md` for the full history.

- `saved/<date>-<name>/`: a frozen state. It holds the script, its inputs that aren't stems (`got-ai.wav`),
  the sound WAV and the Reel. Rebuild it exactly from `media/pan-dude` with:
  `FFMPEG=… python sound/saved/<dir>/suno_exact.py _work/stems-song1 <name>` (it writes next to the script).
- `try/<topic>/`: a copy of the script to experiment on, so the working copy and the saves stay untouched.
  Run it from inside the folder with `../../../_work/stems-song1` as the stems path.

| Folder | What |
|---|---|
| `saved/finalv100` | **final v1.0.0** (2026-11-13): clown-deep + godlike "To know, you need" at full speed, overlapping. Also `media/production/live/sbozhme_pan-dude-reels-finalv100.mp4` |
| `saved/2026-11-13-clown-deep` | the state before finalv100: no "dot", AI GOT, 0.20s reading lag, early "I've become", whole "us", unbroken Emperor run, clown 16.75-19.17, deep Emperor "To know, you need" |
| `try/emperor-voice` | other voices for "To know, you need": `EMPEROR=emperor-dark|emperor-god|emperor-whisper` → `<name>.wav`, `reel-<name>.mp4`; no `EMPEROR` = the saved state. `WHOLE=<same names or emperor>` puts that voice on the whole vocal except the clown span → `whole-<name>.wav`, `reel-whole-<name>.mp4` |
| `try/emperor-voice` → `reel-god-full.mp4` | saved state, but "To know, you need" in `emperor-god` (`LINE_FX`), at x1.00 (`FULL_SPEED`): 19.17-~22.55 plus a 1s echo tail, over the flash, "I've CENSORED myself" and "16 times" |
