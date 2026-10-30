#!/usr/bin/env bash
#
# npm-publish.sh: runs a lerna publish command (release.yaml) one package at a time, and lets the
# release go on when the only failures are npm provenance's 409:
#
#   TLOG_CREATE_ENTRY_ERROR ... (409) an equivalent entry already exists in the transparency log
#
# The 409 is usually transient: the same version often publishes on a later attempt, in the same
# job or a later run (v0.35.0: logger and callrecord). So with `--attempts N`, when a run's only
# failures are 409s, the script runs the command again, up to N runs. Use it only with
# `lerna publish from-package`, which publishes only the versions npm still lacks. lerna skips
# every package that depends on a failed one, so a package still refused after the last attempt
# keeps its previous version on npm, and so do its dependents. Any other failure fails the step on
# the first attempt.
#
#   ops/release/npm-publish.sh [--attempts N] [--defer] [--] <lerna publish command...>
#
#   --attempts N  runs in total (default 1); waits NPM_PUBLISH_RETRY_DELAY*n seconds before run n+1
#                 (default 30).
#   --defer       when 409s remain, leaves a notice instead of the warnings and the run summary: a
#                 later publish step reports them.
#
#   ops/release/npm-publish.sh --defer npm run release
#   ops/release/npm-publish.sh --attempts 4 npx lerna publish from-package --yes --dist-tag latest
set -uo pipefail

attempts=1
defer=false
while [ "$#" -gt 0 ]; do
  case "$1" in
    --attempts) attempts="${2:-}"; shift; [ "$#" -gt 0 ] && shift ;;
    --defer) defer=true; shift ;;
    --) shift; break ;;
    *) break ;;
  esac
done
if [ "$#" -eq 0 ] || ! [[ "$attempts" =~ ^[1-9][0-9]*$ ]]; then
  echo "usage: ops/release/npm-publish.sh [--attempts N] [--defer] [--] <lerna publish command...>" >&2
  exit 2
fi
if [ "$attempts" -gt 1 ] && ! [[ " $* " == *" lerna publish from-package "* ]]; then
  echo "npm-publish.sh: --attempts retries only lerna publish from-package, not: $*" >&2
  exit 2
fi

# npm run keeps the flags after the script name for itself unless they follow `--`: without it,
# `--concurrency 1` below reached lerna as a bare `1` (release run 41045837867).
if [ "$1" = npm ] && [ "${2:-}" = run ] && ! [[ " $* " == *" -- "* ]]; then
  set -- "$@" --
fi

# A package's own version: unchanged packages keep an older one.
version_of() {
  node -e '
    const fs = require("fs"), path = require("path");
    for (const w of require(path.resolve("package.json")).workspaces) {
      const dir = w.replace(/\/\*$/, "");
      for (const d of fs.readdirSync(dir)) {
        const f = path.join(dir, d, "package.json");
        if (!fs.existsSync(f)) continue;
        const p = JSON.parse(fs.readFileSync(f, "utf8"));
        if (p.name === process.argv[1]) console.log(p.version);
      }
    }' "$1"
}

log="$(mktemp)"
for ((n = 1; n <= attempts; n++)); do
  if [ "$n" -gt 1 ]; then
    echo "npm provenance answered 409 for ${refused# }; retrying lerna publish from-package (attempt $n of $attempts)"
    sleep $(( ${NPM_PUBLISH_RETRY_DELAY:-30} * (n - 1) ))
    git checkout -- .
  fi
  # --concurrency 1: parallel signing made the 409s more frequent.
  "$@" --concurrency 1 2>&1 | tee "$log"
  status=${PIPESTATUS[0]}
  [ "$status" -eq 0 ] && exit 0

  # Each failed package's cause is the first `lerna ERR!` line after it.
  failed="$(awk '
    /Package failed to publish: / { if (pkg != "") print pkg, "?"; pkg = $NF; next }
    /lerna ERR! / && pkg != "" { print pkg, (/TLOG_CREATE_ENTRY_ERROR/ ? "409" : "other"); pkg = "" }
    END { if (pkg != "") print pkg, "?" }' "$log")"
  if [ -z "$failed" ]; then
    echo "::error::lerna publish failed (exit $status), not only with provenance 409s"
    exit "$status"
  fi
  refused=""
  while read -r pkg cause; do
    version="$(version_of "$pkg" < /dev/null)"
    # A re-publish of a version npm already has also answers 409.
    [ -n "$version" ] && [ "$(npm view "$pkg@$version" version 2>/dev/null < /dev/null)" = "$version" ] && continue
    if [ "$cause" != 409 ]; then
      echo "::error::lerna publish failed (exit $status), not only with provenance 409s"
      exit "$status"
    fi
    refused="$refused $pkg"
  done <<< "$failed"
  [ -z "$refused" ] && exit 0
done

refused="$(tr ' ' '\n' <<< "${refused# }" | sort -u)"
if [ "$defer" = true ]; then
  echo "::notice::npm provenance answered 409 for $(echo "$refused" | paste -sd " " -); a later publish step retries them"
  exit 0
fi
for p in $refused; do
  echo "::warning::$p: npm provenance answered 409 on every attempt ($attempts); it and the packages that depend on it stay on their previous version"
done
{
  echo "### Packages npm provenance refused (409) after $attempts attempts"
  echo
  for p in $refused; do echo "- $p"; done
  echo
  echo "These and the packages that depend on them were not published at this version. Rerun the release (\`gh workflow run release.yaml\`) to try again; a later release, or a \`Release-As:\` footer, also publishes them."
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit 0
