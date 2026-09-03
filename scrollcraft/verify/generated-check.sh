#!/usr/bin/env bash
# Do the committed pages match the generators that produce them?
#
# This exists because of a specific regression. Commit 26fcd4a removed
# fabricated client metrics from work.html and case-first-rehab.html but left
# the same figures in scripts/build_work.py and scripts/build_case.py. Those
# pages are generated, so the next build wrote the fabricated numbers straight
# back over the fix, and nothing noticed for weeks.
#
# Editing a generated page is not a fix on this repo; it is a fix with a timer
# on it. This gate makes that failure loud: it re-runs every generator and
# fails if the working tree changes, which means what is committed is not what
# the generators produce.
#
#   ./scrollcraft/verify/generated-check.sh
set -uo pipefail
cd "$(dirname "$0")/../.."

# sitemap.xml is compared with its <lastmod> values stripped. They come from
# git, so a freshly generated sitemap always carries the date of the commit
# that is about to be made and can never byte-match the one inside it. That
# churn is legitimate; what this gate is for is content drifting away from the
# generator that produces it.
TRACKED=("*.html" "insights/*.html" robots.txt llms.txt)
strip_lastmod() { sed 's|<lastmod>[^<]*</lastmod>||g' "$1"; }

drift() {
  git diff --quiet -- "${TRACKED[@]}" || return 0
  diff -q <(strip_lastmod sitemap.xml) <(git show HEAD:sitemap.xml | sed 's|<lastmod>[^<]*</lastmod>||g') >/dev/null || return 0
  return 1
}

if drift; then
  echo "generated: working tree already has uncommitted page changes — commit or stash first"
  exit 1
fi

python3 scripts/pages.py >/dev/null || exit 1
for p in work services studio process pricing contact case pay 404 local insights; do
  python3 "scripts/build_$p.py" >/dev/null || exit 1
done
python3 scripts/sync_index.py >/dev/null || exit 1
python3 scripts/build_meta.py  >/dev/null || exit 1

if ! drift; then
  echo "generated: every committed page matches the generator that produces it"
  exit 0
fi

echo "generated: FAILED — these files differ from what the generators produce:"
git diff --name-only -- "${TRACKED[@]}" | sed 's/^/  /'
diff -q <(strip_lastmod sitemap.xml) <(git show HEAD:sitemap.xml | sed 's|<lastmod>[^<]*</lastmod>||g') \
  >/dev/null || echo "  sitemap.xml (beyond its lastmod values)"
echo
echo "  Someone edited a generated page by hand, or edited a generator without"
echo "  rebuilding. Fix it in scripts/, re-run the build, and commit the output."
exit 1
