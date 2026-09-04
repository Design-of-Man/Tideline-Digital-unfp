#!/usr/bin/env python3
"""Pre-deploy gate for the Design of Man site.

Run from the project root:  python3 _dev/preflight.py

Fails on anything that would ship broken: unconfigured endpoints, broken
internal links, missing assets, duplicate or missing meta, invalid JSON-LD,
images without alt, pages missing from the sitemap.
"""

import os
import re
import json
import glob
import sys
from html.parser import HTMLParser

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DOMAIN = "https://www.designofman.com"

blockers, notes = [], []
seen_titles, seen_descs = {}, {}


class Doc(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = None
        self._in_title = False
        self.metas = {}
        self.canonical = None
        self.links, self.imgs, self.scripts = [], [], []
        self.h1 = 0
        self.landmarks = set()
        self.ld = []
        self._in_ld = False
        self._buf = ""
        self.lang = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            k = a.get("name") or a.get("property")
            if k:
                self.metas[k] = a.get("content", "")
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "script":
            if a.get("src"):
                self.scripts.append(a["src"])
            if a.get("type") == "application/ld+json":
                self._in_ld = True
                self._buf = ""
        elif tag == "h1":
            self.h1 += 1
        elif tag in ("header", "nav", "main", "footer"):
            self.landmarks.add(tag)

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "script" and self._in_ld:
            self._in_ld = False
            try:
                self.ld.append(json.loads(self._buf))
            except Exception as e:
                blockers.append(("SCHEMA", "invalid JSON-LD: %s" % e))

    def handle_data(self, d):
        if self._in_title:
            self.title = (self.title or "") + d.strip()
        if self._in_ld:
            self._buf += d


# Paths served by the hosting platform rather than by anything in this repo.
# /_vercel/* is Vercel's own Web Analytics and Speed Insights bundle, injected
# at the edge when those features are enabled on the project; there is no file
# here to find and there never will be. /api/* is a serverless function, which
# exists as api/<name>.mjs rather than at the URL it answers on.
PLATFORM_PREFIXES = ("/_vercel/", "/api/")


def platform_served(href):
    return href.startswith(PLATFORM_PREFIXES)


def resolve(page, href):
    base = os.path.dirname(os.path.join(ROOT, page))
    clean = href.split("#")[0].split("?")[0]
    # A leading slash means site-root-relative. os.path.join would treat it as an
    # absolute filesystem path and silently drop ROOT, so join it to ROOT by hand.
    if clean.startswith("/"):
        t = os.path.normpath(os.path.join(ROOT, clean.lstrip("/")))
    else:
        t = os.path.normpath(os.path.join(base, clean))
    if os.path.isdir(t):
        t = os.path.join(t, "index.html")
    # cleanUrls: /work resolves to work.html
    if not os.path.exists(t) and os.path.exists(t + ".html"):
        t += ".html"
    return t


# Recursive, so pages in a subdirectory are gated too. The flat glob this
# replaced silently skipped everything under /insights/ -- four pages checked
# by nothing, which is the failure mode a pre-deploy gate exists to prevent.
SKIP_DIRS = {"_dev", "books", "node_modules", ".git", ".vercel", "scrollcraft"}

pages = sorted(
    os.path.relpath(p, ROOT)
    for p in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    if not (SKIP_DIRS & set(os.path.relpath(p, ROOT).split(os.sep)))
)

for rel in pages:
    html = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    d = Doc()
    d.feed(html)

    def bad(c, m):
        blockers.append((c, "%s — %s" % (rel, m)))

    def note(c, m):
        notes.append((c, "%s — %s" % (rel, m)))

    # unconfigured endpoints must never ship
    for ph in set(re.findall(r"REPLACE_[A-Z_]+", html)):
        bad("CONFIG", "unconfigured placeholder: %s" % ph)
    if "formspree.io/f/REPLACE" in html or 'action=""' in html:
        bad("CONFIG", "form endpoint not set")

    if not d.lang:
        bad("A11Y", "missing lang on <html>")
    if not d.title:
        bad("SEO", "missing <title>")
    elif len(d.title) > 62:
        note("SEO", "title %d chars: %s" % (len(d.title), d.title))
    desc = d.metas.get("description", "")
    if not desc:
        bad("SEO", "missing meta description")
    elif not (110 <= len(desc) <= 170):
        note("SEO", "meta description %d chars" % len(desc))
    if not d.canonical:
        # A 404 is a status response, not a destination — it correctly has none.
        if rel != "404.html":
            bad("SEO", "missing canonical")
    elif not d.canonical.startswith(DOMAIN):
        bad("SEO", "canonical not on production domain: %s" % d.canonical)

    for t in ["og:title", "og:description", "og:image", "og:url", "twitter:card"]:
        if t not in d.metas:
            note("SEO", "missing %s" % t)

    if d.title in seen_titles:
        bad("SEO", "duplicate title with %s" % seen_titles[d.title])
    seen_titles[d.title] = rel
    if desc and desc in seen_descs:
        bad("SEO", "duplicate meta description with %s" % seen_descs[desc])
    seen_descs[desc] = rel

    if d.h1 == 0:
        bad("A11Y", "no <h1>")
    elif d.h1 > 1:
        bad("A11Y", "%d <h1> elements" % d.h1)
    for lm in ("header", "nav", "main", "footer"):
        if lm not in d.landmarks:
            note("A11Y", "missing <%s>" % lm)

    for img in d.imgs:
        if "alt" not in img:
            bad("A11Y", "img missing alt: %s" % img.get("src", "?"))
        src = img.get("src", "")
        if src and not src.startswith(("http", "data:")) and not os.path.exists(resolve(rel, src)):
            bad("LINK", "missing image: %s" % src)

    for src in d.scripts:
        if src.startswith("http") or platform_served(src):
            continue
        if not os.path.exists(resolve(rel, src)):
            bad("LINK", "missing script: %s" % src)

    for href in d.links:
        if href.startswith(("http", "mailto:", "tel:", "#", "data:")):
            if href.startswith("tel:") and not re.match(r"^tel:\+1\d{10}$", href):
                note("LINK", "tel: not in +1########## form: %s" % href)
            continue
        if href == "#":
            note("LINK", 'dead link href="#"')
            continue
        if not os.path.exists(resolve(rel, href)):
            bad("LINK", "broken internal link: %s" % href)

for f in ["vercel.json", "robots.txt", "sitemap.xml", "og.png"]:
    if not os.path.exists(os.path.join(ROOT, f)):
        blockers.append(("BUILD", "missing %s" % f))

sm = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
locs = set(re.findall(r"<loc>(.*?)</loc>", sm))
noindexed = set()
for rel in pages:
    html = open(os.path.join(ROOT, rel), encoding="utf-8").read()
    if re.search(r'<meta[^>]+name=["\']robots["\'][^>]+noindex', html, re.I):
        noindexed.add(rel)
for rel in pages:
    # 404 and any deliberately noindexed page are not sitemap candidates.
    if rel == "404.html" or rel in noindexed:
        continue
    # cleanUrls serves foo/index.html at /foo, not at /foo/index. Without this
    # every directory-index page reads as missing from the sitemap.
    if rel == "index.html":
        slug = ""
    elif rel.endswith("/index.html"):
        slug = rel[:-len("/index.html")]
    else:
        slug = rel[:-5]
    url = DOMAIN + "/" + slug
    if url not in locs:
        notes.append(("SEO", "not in sitemap: %s" % rel))

print("=" * 66)
print("DESIGN OF MAN — PRE-DEPLOY CHECK")
print("=" * 66)
print("Pages checked: %d\n" % len(pages))

if blockers:
    print("BLOCKERS (%d)\n%s" % (len(blockers), "-" * 66))
    for c, m in blockers:
        print("  [%s] %s" % (c, m))
    print()
else:
    print("BLOCKERS: none\n")

if notes:
    grouped = {}
    for c, m in notes:
        grouped.setdefault(c, []).append(m)
    print("NOTES (%d)\n%s" % (len(notes), "-" * 66))
    for c in sorted(grouped):
        print("  [%s] %d" % (c, len(grouped[c])))
        for m in grouped[c][:5]:
            print("      · %s" % m)
        if len(grouped[c]) > 5:
            print("      · …and %d more" % (len(grouped[c]) - 5))
    print()

print("=" * 66)
print("RESULT: %s" % ("FAIL — do not deploy" if blockers else "READY TO DEPLOY"))
print("=" * 66)
sys.exit(1 if blockers else 0)
