#!/usr/bin/env bash
# Builds the "pan-dude" blog loop: clip 1 + one-frame flash image + clip 2,
# word-by-word captions burned in, plus a compressed web copy and a poster.
#
# Inputs (git-ignored, keep next to this script):
#   sbozhme_pan-dude-1.mp4, sbozhme_pan-dude-2.mp4  832x464 @ 24fps Midjourney clips
#   flash.png                                       the "25th frame" still
#
# Usage: FFMPEG=/path/to/ffmpeg ./build.sh   (defaults to ffmpeg on PATH)
set -euo pipefail

cd "$(dirname "$0")"
FFMPEG="${FFMPEG:-ffmpeg}"
FONTS_DIR="../../apps/web/public/fonts"
OUT=sbozhme_pan-dude

# 1. Concatenate: clip 1, a single frame of the still, clip 2
"$FFMPEG" -v error -y \
  -i sbozhme_pan-dude-1.mp4 \
  -loop 1 -framerate 24 -i flash.png \
  -i sbozhme_pan-dude-2.mp4 \
  -filter_complex "[0:v]setsar=1,format=yuv420p[a];[1:v]trim=end_frame=1,setpts=PTS-STARTPTS,scale=832:464:flags=lanczos,setsar=1,format=yuv420p[b];[2:v]setsar=1,format=yuv420p[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -crf 18 -preset slow -r 24 -movflags +faststart \
  "$OUT-25th-frame.mp4"

# 2. Burn in one-word-at-a-time captions
python3 words.py
"$FFMPEG" -v error -y -i "$OUT-25th-frame.mp4" \
  -vf "ass=words.ass:fontsdir=$FONTS_DIR" \
  -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart -an \
  "$OUT-words.mp4"

# 3. Web copy (~4 MB) and poster for the <video> embed
"$FFMPEG" -v error -y -i "$OUT-words.mp4" \
  -c:v libx264 -crf 27 -preset veryslow -tune animation -pix_fmt yuv420p \
  -profile:v high -movflags +faststart -an \
  "$OUT-words-web.mp4"
"$FFMPEG" -v error -y -i "$OUT-words.mp4" -frames:v 1 -q:v 3 "$OUT-poster.jpg"

echo "Built $OUT-words-web.mp4 and $OUT-poster.jpg"
