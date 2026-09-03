#!/usr/bin/env bash
# Every gate, in one command. Exits non-zero if any of them fails.
#
#   ./scrollcraft/verify/run-all.sh
#
# a11y, reveal, target, coverage and vitals need a static server on :4500;
# this starts one and takes it down again. csp-check runs its own server on
# :8901 because it has to serve the headers from vercel.json.
set -uo pipefail
cd "$(dirname "$0")/../.."

FAIL=0
run() { printf '\n\033[1m== %s\033[0m\n' "$1"; shift; "$@" || FAIL=1; }

python3 -m http.server 4500 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 2

PAGES=(index.html work.html services.html studio.html process.html pricing.html
       contact.html case-first-rehab.html pay.html 404.html
       web-design-jupiter-fl.html insights/index.html)

run "generated"  ./scrollcraft/verify/generated-check.sh
run "preflight"  python3 _dev/preflight.py
run "links"      node scrollcraft/verify/links-check.cjs
run "reveals"    node scrollcraft/verify/reveal-check.cjs
run "targets"    node scrollcraft/verify/target-check.cjs
run "forms"      node scrollcraft/verify/form-check.cjs
run "csp"        node scrollcraft/verify/csp-check.cjs
run "vitals"     node scrollcraft/verify/vitals-check.cjs

printf '\n\033[1m== a11y (contrast, hidden focusables)\033[0m\n'
for p in "${PAGES[@]}"; do
  node scrollcraft/verify/a11y-check.cjs "$p" 2>&1 | grep -E "contrast fails|focusable but hidden" \
    | sed "s|^|  $p |" || FAIL=1
done

printf '\n\033[1m== coverage (text painted over)\033[0m\n'
for p in index.html web-design-jupiter-fl.html insights/index.html; do
  node scrollcraft/verify/coverage-check.cjs "$p" 1440 900 2>&1 | tail -1 | sed 's|^|  |' || FAIL=1
  node scrollcraft/verify/coverage-check.cjs "$p" 390 844 2>&1 | tail -1 | sed 's|^|  |' || FAIL=1
done

if [ "$FAIL" -ne 0 ]; then
  printf '\n\033[31mSOMETHING FAILED — do not deploy\033[0m\n'; exit 1
fi
printf '\n\033[32mall gates green\033[0m\n'
