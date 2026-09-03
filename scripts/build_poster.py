#!/usr/bin/env python3
"""Derive the responsive variants of the film poster.

The poster is the homepage's LCP element. It shipped as a single 1600x814
JPEG at 170KB, served identically to a 390px phone on a slow connection --
about 0.85s of the LCP budget spent on pixels that phone cannot resolve.

This emits WebP at two widths alongside the original JPEG, which stays as the
fallback for anything that cannot decode WebP. Re-run after replacing
film-poster.jpg.

    python3 scripts/build_poster.py
"""
import pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/video/sc/film-poster.jpg"

# 960 covers a 390px viewport at DPR 2 with room to spare. 1200 is the one that
# matters most: a 390px phone at DPR 3 needs ~1170 device pixels, so without a
# candidate at 1200 it skips 960 and takes the full 1600 -- 147KB instead of
# 88KB, spent on the page's LCP element over a mobile connection.
WIDTHS = [960, 1200, 1600]


def main():
    im = Image.open(SRC).convert("RGB")
    print(f"  source {SRC.name}  {im.width}x{im.height}  {SRC.stat().st_size:,} bytes")
    for w in WIDTHS:
        h = round(im.height * w / im.width)
        out = SRC.with_name(f"film-poster-{w}.webp")
        im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=76, method=6)
        print(f"  {out.name:28} {w}x{h}  {out.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
