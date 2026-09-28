"""Make logo-outlined.png: the site logo with a bold obsidian border, matching the
captions' 3px outline once it's scaled down to the censor size in glitch.py.

Usage: FFMPEG=/path/to/ffmpeg python3 logo.py
"""

import os
import subprocess
from pathlib import Path

SRC = "../../apps/web/public/android-chrome-192x192.png"
SIDE = 192
PAD = 17  # 3px caption outline at 34px display size = 3 * 192 / 34 ~ 17px at source size
OBSIDIAN = "0x0A0A0F"

here = Path(__file__).parent
full = SIDE + 2 * PAD
graph = ";".join([
    f"[0]format=rgba,pad={full}:{full}:{PAD}:{PAD}:color=black@0,split[a][b]",
    # grow the alpha mask by PAD pixels, paint it obsidian, put the logo on top
    "[a]alphaextract," + ",".join(["dilation"] * PAD) + "[m]",
    f"color=c={OBSIDIAN}:s={full}x{full},format=rgba[k]",
    "[k][m]alphamerge[o]",
    "[o][b]overlay=format=auto",
])
subprocess.run([os.environ.get("FFMPEG", "ffmpeg"), "-v", "error", "-y", "-i", SRC,
                "-filter_complex", graph, "-frames:v", "1", "logo-outlined.png"],
               cwd=here, check=True)
print("logo-outlined.png", f"{full}x{full}")
