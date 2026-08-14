#!/usr/bin/env python3
"""Pull a client's existing site into a reusable inventory.

    python3 ingest.py https://example.com --out ./ingest/example

Crawls same-origin pages, saves the copy as markdown, downloads every image,
and records what each image is actually good for. The point is to know what
real material exists before a rebuild starts — most "the site looks cheap"
problems are missing assets, not missing capability, and most rebuilds stall
waiting for photographs nobody inventoried.

Needs Playwright's Chromium, which is preinstalled in this environment.
"""

import argparse
import csv
import json
import os
import re
import sys
import urllib.parse as up
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("playwright not available: pip install playwright")

UA = "DesignOfMan-SiteIngest/1.0 (+site audit; contact hello@designofman.com)"

# Claude Code containers ship Chromium under /opt/pw-browsers, but the pip
# playwright package pins a different build number and would otherwise try to
# download its own. Point it at whatever is actually on disk instead — never run
# `playwright install` here.
def chromium_path():
    if os.environ.get("PLAYWRIGHT_CHROMIUM"):
        return os.environ["PLAYWRIGHT_CHROMIUM"]
    root = Path(os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers"))
    for pattern in ("chromium-*/chrome-linux/chrome",
                    "chromium_headless_shell-*/chrome-linux/headless_shell"):
        hits = sorted(root.glob(pattern))
        if hits:
            return str(hits[-1])
    return None  # let Playwright use its own default

# Width thresholds. A hero needs to survive a 2x retina display at full bleed;
# anything under 800 has no use beyond a thumbnail. These are the numbers that
# decide whether a rebuild can reuse an asset or has to commission a new one.
HERO_MIN = 2000
SECTION_MIN = 1200
THUMB_MIN = 800


def slugify(url, root):
    path = up.urlparse(url).path.strip("/")
    return re.sub(r"[^a-z0-9]+", "-", (path or "index").lower()).strip("-") or "index"


def verdict(w, h):
    if not w:
        return "unknown", "could not measure — may be CSS background or lazy-loaded"
    if w >= HERO_MIN:
        return "hero", "large enough for a full-bleed hero at 2x"
    if w >= SECTION_MIN:
        return "section", "usable for section imagery, not a full-bleed hero"
    if w >= THUMB_MIN:
        return "thumbnail", "thumbnail or card only"
    return "unusable", f"{w}px wide — too small to reuse; recommission"


def discover(page, root, max_pages):
    """Prefer the sitemap; fall back to crawling same-origin links."""
    origin = f"{up.urlparse(root).scheme}://{up.urlparse(root).netloc}"
    found = []
    try:
        r = page.request.get(f"{origin}/sitemap.xml", timeout=15000)
        if r.ok:
            found = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", r.text())
            found = [u for u in found if u.startswith(origin)]
    except Exception:
        pass

    if found:
        return found[:max_pages]

    seen, queue, out = {root}, [root], []
    while queue and len(out) < max_pages:
        url = queue.pop(0)
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            # Never swallow this. A silently empty crawl looks like "the site has
            # no pages" when the real cause is usually a blocked network.
            print(f"  cannot reach {url}: {type(e).__name__}: {str(e)[:200]}")
            continue
        out.append(url)
        for href in page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)"):
            clean = href.split("#")[0].split("?")[0]
            if clean.startswith(origin) and clean not in seen and not re.search(
                r"\.(pdf|jpe?g|png|gif|svg|zip|mp4|webp)$", clean, re.I
            ):
                seen.add(clean)
                queue.append(clean)
    return out


# Runs in the page. Returns the copy plus every image with its *natural*
# dimensions, which is the only number that says whether an asset is reusable —
# the rendered size just reflects the current layout.
EXTRACT = """
() => {
  const txt = s => Array.from(document.querySelectorAll(s)).map(e => e.innerText.trim()).filter(Boolean);
  const imgs = Array.from(document.querySelectorAll('img')).map(i => ({
    src: i.currentSrc || i.src,
    alt: i.getAttribute('alt'),
    naturalWidth: i.naturalWidth,
    naturalHeight: i.naturalHeight,
    renderedWidth: Math.round(i.getBoundingClientRect().width),
    loading: i.getAttribute('loading'),
    kind: 'img'
  })).filter(i => i.src && !i.src.startsWith('data:'));

  const bgs = [];
  for (const el of document.querySelectorAll('*')) {
    const bg = getComputedStyle(el).backgroundImage;
    const m = bg && bg.match(/url\\(["']?(.*?)["']?\\)/);
    if (m && m[1] && !m[1].startsWith('data:')) {
      bgs.push({ src: new URL(m[1], location.href).href, alt: null,
                 naturalWidth: 0, naturalHeight: 0,
                 renderedWidth: Math.round(el.getBoundingClientRect().width),
                 loading: null, kind: 'background' });
    }
  }

  return {
    title: document.title,
    description: (document.querySelector('meta[name=description]') || {}).content || '',
    canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
    h1: txt('h1'), h2: txt('h2'), h3: txt('h3'),
    body: document.body.innerText.replace(/\\n{3,}/g, '\\n\\n').trim(),
    tel: Array.from(document.querySelectorAll('a[href^="tel:"]')).map(a => a.getAttribute('href')),
    mailto: Array.from(document.querySelectorAll('a[href^="mailto:"]')).map(a => a.getAttribute('href')),
    forms: document.querySelectorAll('form').length,
    images: imgs.concat(bgs)
  };
}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--out", default="./ingest")
    ap.add_argument("--max-pages", type=int, default=40)
    ap.add_argument("--skip-images", action="store_true",
                    help="inventory images without downloading the bytes")
    a = ap.parse_args()

    out = Path(a.out)
    (out / "pages").mkdir(parents=True, exist_ok=True)
    if not a.skip_images:
        (out / "images").mkdir(parents=True, exist_ok=True)

    pages, images = [], {}

    with sync_playwright() as p:
        exe = chromium_path()
        kw = {"executable_path": exe} if exe else {}
        # Chromium ignores HTTPS_PROXY unless told; sandboxed environments route
        # all egress through one.
        proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
        if proxy:
            kw["proxy"] = {"server": proxy}
        browser = p.chromium.launch(**kw)
        ctx = browser.new_context(user_agent=UA, viewport={"width": 1440, "height": 900},
                                  ignore_https_errors=bool(proxy))
        page = ctx.new_page()

        # Prove the site is reachable before crawling, so a network policy
        # denial reads as a network policy denial rather than an empty site.
        try:
            page.goto(a.url, wait_until="domcontentloaded", timeout=30000)
        except Exception as e:
            browser.close()
            sys.exit(
                f"\nCannot reach {a.url}\n  {type(e).__name__}: {str(e)[:300]}\n\n"
                "If this is a Claude Code cloud session, the environment's network\n"
                "policy most likely forbids general outbound web access — check\n"
                f'  curl -sS "$HTTPS_PROXY/__agentproxy/status"\n'
                "and run this from a machine or environment with open egress instead."
            )

        urls = discover(page, a.url, a.max_pages)
        print(f"{len(urls)} pages to read")

        for i, url in enumerate(urls, 1):
            try:
                page.goto(url, wait_until="networkidle", timeout=45000)
            except Exception as e:
                print(f"  [{i}/{len(urls)}] {url} — FAILED: {type(e).__name__}")
                continue
            # Force lazy-loaded imagery to resolve before measuring.
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(900)

            d = page.evaluate(EXTRACT)
            d["url"] = url
            pages.append(d)
            print(f"  [{i}/{len(urls)}] {url} — {len(d['images'])} images")

            for img in d["images"]:
                rec = images.setdefault(img["src"], {**img, "pages": []})
                rec["pages"].append(url)
                # Keep the largest natural size seen for this asset.
                if img["naturalWidth"] > rec["naturalWidth"]:
                    rec["naturalWidth"] = img["naturalWidth"]
                    rec["naturalHeight"] = img["naturalHeight"]

        if not a.skip_images:
            print(f"downloading {len(images)} images")
            for n, (src, rec) in enumerate(images.items(), 1):
                ext = (os.path.splitext(up.urlparse(src).path)[1] or ".img")[:6]
                name = f"{n:03d}-{re.sub(r'[^a-z0-9]+', '-', os.path.splitext(os.path.basename(up.urlparse(src).path))[0].lower())[:40] or 'image'}{ext}"
                try:
                    r = page.request.get(src, timeout=30000)
                    if r.ok:
                        body = r.body()
                        (out / "images" / name).write_bytes(body)
                        rec["bytes"] = len(body)
                        rec["file"] = name
                except Exception:
                    rec["bytes"] = 0

        browser.close()

    for d in pages:
        slug = slugify(d["url"], a.url)
        (out / "pages" / f"{slug}.md").write_text(
            f"# {d['title']}\n\n"
            f"- URL: {d['url']}\n- Canonical: {d['canonical'] or '(none)'}\n"
            f"- Meta description: {d['description'] or '(none)'}\n"
            f"- Phone links: {', '.join(d['tel']) or '(none)'}\n"
            f"- Email links: {', '.join(d['mailto']) or '(none)'}\n"
            f"- Forms: {d['forms']}\n\n"
            f"## Headings\n\n"
            + "".join(f"- H1: {h}\n" for h in d["h1"])
            + "".join(f"  - H2: {h}\n" for h in d["h2"])
            + f"\n## Copy\n\n{d['body']}\n",
            encoding="utf-8")

    with (out / "images.csv").open("w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f)
        wr.writerow(["file", "src", "natural_w", "natural_h", "bytes", "alt", "kind", "verdict", "note", "pages"])
        for src, r in images.items():
            v, note = verdict(r["naturalWidth"], r["naturalHeight"])
            wr.writerow([r.get("file", ""), src, r["naturalWidth"], r["naturalHeight"],
                         r.get("bytes", ""), r["alt"] or "", r["kind"], v, note,
                         " ".join(sorted(set(r["pages"])))])

    buckets = {}
    for r in images.values():
        buckets.setdefault(verdict(r["naturalWidth"], r["naturalHeight"])[0], []).append(r)
    missing_alt = [r for r in images.values() if r["kind"] == "img" and not (r["alt"] or "").strip()]

    (out / "inventory.md").write_text(
        f"""---
type: ingest
source: {a.url}
pages: {len(pages)}
images: {len(images)}
---

# {a.url} — ingest

## What can be reused

| Verdict | Count | Means |
|---|---|---|
| hero | {len(buckets.get('hero', []))} | full-bleed at 2x |
| section | {len(buckets.get('section', []))} | section imagery only |
| thumbnail | {len(buckets.get('thumbnail', []))} | cards and thumbnails |
| unusable | {len(buckets.get('unusable', []))} | too small — recommission |
| unknown | {len(buckets.get('unknown', []))} | CSS background or lazy — measure by hand |

**{len(buckets.get('hero', []))} images can carry a hero.** If that number is
low, the rebuild is blocked on photography, not on design — say so at kickoff
rather than three weeks in.

## Accessibility

{len(missing_alt)} of {len([r for r in images.values() if r['kind'] == 'img'])} `<img>` elements have no alt text.

## Files

- `pages/` — copy and metadata, one note per page
- `images/` — downloaded originals
- `images.csv` — every image with dimensions, verdict, and where it is used

## Next

Read `images.csv` before scoping. Then fill the client's Brand note asset
checklist from what is actually here, and put anything missing in front of the
client as a specific list — "31 photos at 2000px or wider" lands; "send photos"
does not.
""", encoding="utf-8")

    print(f"\n{len(pages)} pages, {len(images)} images -> {out}")
    print(f"hero-capable: {len(buckets.get('hero', []))}  unusable: {len(buckets.get('unusable', []))}")


if __name__ == "__main__":
    main()
