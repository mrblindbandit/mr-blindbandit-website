#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

command -v timeout || {
  echo "build-verified.sh requires GNU timeout." >&2
  exit 69
}

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Running bounded vinext build..."
if command -v python3 >/dev/null 2>&1; then
  python3 "${SITES_PROJECT_ROOT}/scripts/portal.py"
else
  echo "Python unavailable: using committed, generated page snapshot."
  test -s "${SITES_PROJECT_ROOT}/worker/site-pages.ts"
  test -s "${SITES_PROJECT_ROOT}/public/sitemap.xml"
fi
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build
if command -v python3 >/dev/null 2>&1; then
  python3 "${SITES_PROJECT_ROOT}/scripts/check-public-pages.py"
  python3 "${SITES_PROJECT_ROOT}/scripts/check-accessibility.py"
fi
node --test "${SITES_PROJECT_ROOT}/tests/crawl.test.mjs"
node "${SITES_PROJECT_ROOT}/scripts/protect-private-pages.mjs"
