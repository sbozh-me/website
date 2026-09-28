# Production videos: "Дарио, так какой стул?"

The latest cut of each video, copied from `media/pan-dude` (rebuild them there with
`build.sh` / `glitch.py`). The video files are git-ignored. Upload the `-web` copies to
Directus and embed them with `<WindowVideo>` (see below).

| File | What | Window |
|---|---|---|
| `sbozhme_pan-dude-glitch-tracked-web.mp4` | Original script, glitch captions, D✳CK PITCH tracked on the figure | ON |
| `sbozhme_pan-dude-corporate-dicked-v4-web.mp4` | Corporate script in the glitch look: ONBOARDED → SBOZHED, PITCH DECK centred, ✳ alone on the figure | ON |
| `sbozhme_pan-dude-corporate-web.mp4` | Corporate script, plain one-word captions (Space Grotesk, 30% up) | OFF |
| `sbozhme_pan-dude-corporate-shorts-web.mp4` | The same, vertical 9:16 720x1280 for the blog | OFF |
| `sbozhme_pan-dude-corporate-shorts.mp4` | The same, 1080x1920 master for YouTube Shorts | - |
| `sbozhme_pan-dude-uncensored-shorts-web.mp4` | Original script, glitch captions, DICK PITCH centred and uncensored, ✳ alone on the figure; vertical 720x1280 | - |
| `sbozhme_pan-dude-uncensored-shorts.mp4` | The same, 1080x1920 master for YouTube Shorts (`VARIANT=logo-tracked FORMAT=shorts python3 glitch.py`) | - |
| `sbozhme_pan-dude-shorts-poster-clean.jpg` | Vertical poster without captions (frame 0), fits both Shorts | - |
| `sbozhme_pan-dude-poster-clean.jpg` | Poster without captions (frame 0), fits every landscape cut | - |
| `sbozhme_pan-dude-poster.jpg`, `sbozhme_pan-dude-corporate-shorts-poster.jpg` | Older posters with a caption word in them | - |

## One video

The post "Дарио, так какой стул?" uses the two Shorts this way: the corporate one after
"Увидим." and the uncensored one in the 2D section.

```mdx
<Video src="/api/assets/<video id>" poster="/api/assets/<poster id>" title="Pan Dude" />
```

## Switching on the window

```mdx
<WindowVideo
  on="/api/assets/<window ON video id>"
  off="/api/assets/<window OFF video id>"
  onPoster="/api/assets/<poster id>"
  offPoster="/api/assets/<poster id>"
/>
```

The ON video plays while the window is open, and the OFF one when it's closed (button or
W key). On a `==WINDOW OFF==` page the OFF video is the one rendered first.
