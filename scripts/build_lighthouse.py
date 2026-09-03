#!/usr/bin/env python3
"""Derive every homepage hero asset from the studio's own lighthouse footage.

The source is a drone orbit of the real Jupiter Inlet Lighthouse (Dropbox:
lighthouse-1440p.mp4, 2560x1440@60fps, 8.47s, ~5.1MB). It is not committed at
that resolution -- this script's OUTPUT is what ships, the same contract as
every other build_*.py in this directory.

Emits, into assets/video/lighthouse/:
  lighthouse.mp4 / lighthouse.webm       desktop loop,  1600w @ 30fps
  lighthouse-m.mp4 / lighthouse-m.webm   mobile loop,    960w @ 24fps
  lighthouse-poster.jpg                  the LCP element, at source width
  lighthouse-poster-{960,1200,1920}.webp responsive candidates of the poster

Re-run after replacing the source clip:

    python3 scripts/build_lighthouse.py /path/to/lighthouse-source.mp4

Requires ffmpeg (any build with libx264 and libvpx-vp9) and Pillow.
"""
import pathlib
import subprocess
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/video/lighthouse"

# The second the composition is best: tower centred, full inlet in frame,
# clear light. Picked by eye against the extracted frames, not a formula.
POSTER_AT_SECONDS = 4

# 60fps drone footage is far more motion than an ambient looping background
# needs; halving it to 30fps costs nothing perceptible on a shot this static
# and roughly halves the bitrate for the same visual result. The mobile pair
# goes further on both axes because it is competing for LCP budget on a
# throttled connection.
DESKTOP = dict(fps=30, width=1600, crf_h264=24, crf_vp9=34)
MOBILE = dict(fps=24, width=960, crf_h264=28, crf_vp9=38)

POSTER_WIDTHS = [960, 1200, 1920]


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


def encode(src, variant, name):
    vf = f"fps={variant['fps']},scale={variant['width']}:-2"
    ffmpeg("-i", str(src), "-vf", vf, "-c:v", "libx264", "-profile:v", "high",
           "-pix_fmt", "yuv420p", "-preset", "veryslow", "-crf", str(variant["crf_h264"]),
           "-movflags", "+faststart", "-an", str(OUT / f"{name}.mp4"))
    ffmpeg("-i", str(src), "-vf", vf, "-c:v", "libvpx-vp9", "-b:v", "0",
           "-crf", str(variant["crf_vp9"]), "-an", "-row-mt", "1", str(OUT / f"{name}.webm"))
    for ext in ("mp4", "webm"):
        f = OUT / f"{name}.{ext}"
        print(f"  {f.name:24} {f.stat().st_size:,} bytes")


def main():
    if len(sys.argv) != 2:
        sys.exit(f"usage: {sys.argv[0]} /path/to/lighthouse-source.mp4")
    src = pathlib.Path(sys.argv[1])
    if not src.exists():
        sys.exit(f"source not found: {src}")
    OUT.mkdir(parents=True, exist_ok=True)

    encode(src, DESKTOP, "lighthouse")
    encode(src, MOBILE, "lighthouse-m")

    poster = OUT / "lighthouse-poster.jpg"
    ffmpeg("-i", str(src), "-ss", str(POSTER_AT_SECONDS), "-frames:v", "1",
           "-vf", "scale=1920:-2", "-q:v", "2", str(poster))
    im = Image.open(poster).convert("RGB")
    print(f"  {poster.name:24} {im.width}x{im.height}  {poster.stat().st_size:,} bytes")
    for w in POSTER_WIDTHS:
        h = round(im.height * w / im.width)
        out = OUT / f"lighthouse-poster-{w}.webp"
        im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=80, method=6)
        print(f"  {out.name:28} {w}x{h}  {out.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
