#!/usr/bin/env python3
"""Re-derive the shared blocks of the hand-written homepage from pages.py.

`index.html` is bespoke -- the film, the boot panel and the bezel exist on no
other page -- so it is not generated. But the four things every page must
agree on (the schema graph, the footer, the script set, the cache-buster) were
being maintained twice, and the copy in index.html had already drifted: it
carried a ProfessionalService node with a fabricated telephone long after the
generated pages stopped.

This script owns those four blocks and nothing else. Run it after pages.py.

    python3 scripts/sync_index.py
"""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from pages import ROOT, V, SITE, LOGO, FOOTNAV, ANALYTICS, graph, faq

DOC   = ROOT / "index.html"
TITLE = "Design of Man &mdash; Website Creation &amp; Management"
DESC  = ("Design of Man is a small studio in Jupiter, Florida building websites and web "
         "apps with obsessive craft. Strategy, design, build, and care that does not stop "
         "at launch.")


def foot_block():
    links = "".join(f'\n      <a href="{h}">{t}</a>' for h, t in FOOTNAV)
    return f"""<footer class="site-foot">
  <div class="sc-wrap">
    <a href="/" class="mark">{LOGO}<span>Design of Man</span></a>
    <nav aria-label="Footer">{links}
    </nav>
    <small>&copy; 2026 Design of Man. Website creation and management. Jupiter, Florida.</small>
  </div>
</footer>"""


def main():
    s = DOC.read_text()

    # 1 · the schema graph, with the homepage's own FAQ scraped out of its body
    new_ld = graph("/", TITLE, DESC, faq(s, "/"))
    s, n = re.subn(r'<script type="application/ld\+json">.*?</script>', new_ld, s,
                   count=1, flags=re.S)
    assert n == 1, "no JSON-LD block found in index.html"

    # 2 · the footer. The page had none at all, which cost it the site-wide
    #     link set and left the document with no contentinfo landmark.
    s = re.sub(r'\n<footer class="site-foot">.*?</footer>\n', "\n", s, flags=re.S)
    s = s.replace("</main>\n", "</main>\n\n" + foot_block() + "\n", 1)

    # 3 · the script set, in the same order and with the same defer flags the
    #     generated pages use.
    scripts = (f'<script src="/assets/js/vendor/scrollcraft.js?v={V}"></script>\n'
               f'<script src="/assets/js/v3.js?v={V}"></script>\n'
               f'<script src="/assets/js/bar.js?v={V}" defer></script>\n'
               f'<script src="/assets/js/form.js?v={V}" defer></script>\n'
               f'{ANALYTICS}')
    s, n = re.subn(r'<script src="/assets/js/vendor/scrollcraft\.js.*?(?=\n</body>)',
                   scripts, s, count=1, flags=re.S)
    assert n == 1, "no script block found in index.html"

    # 4 · one cache-buster for the whole site
    s = re.sub(r'\?v=\d{8}[a-z]', f"?v={V}", s)

    DOC.write_text(s)
    print(f"  index.html                {len(s):7,} bytes")


if __name__ == "__main__":
    main()
