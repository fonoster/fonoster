#!/usr/bin/env bash
#
# npm-publish.sh: runs a lerna publish command (release.yaml) one package at a time, and lets the
# release go on when the only failures are npm provenance's 409:
#
#   TLOG_CREATE_ENTRY_ERROR ... (409) an equivalent entry already exists in the transparency log
#
# That error sticks to a version: the log already holds the entry for that exact tarball, so every
# retry of it fails the same way. lerna skips the packages that depend on a failed one, so npm stays
# consistent: those packages keep their previous version until a later release publishes them (a
# `Release-As:` footer publishes every package). Any other failure fails the step.
#
#   ops/release/npm-publish.sh npm run release
#   ops/release/npm-publish.sh npx lerna publish from-package --yes --dist-tag latest
set -uo pipefail

log="$(mktemp)"
# --concurrency 1: parallel signing made the 409s more frequent.
"$@" --concurrency 1 2>&1 | tee "$log"
status=${PIPESTATUS[0]}
[ "$status" -eq 0 ] && exit 0

failed="$(grep -oE 'Package failed to publish: [^ ]+' "$log" | awk '{print $NF}' | sort -u)"
conflicts="$(grep -c 'TLOG_CREATE_ENTRY_ERROR' "$log")"
if [ -z "$failed" ] || [ "$conflicts" -ne "$(echo "$failed" | wc -l)" ]; then
  echo "::error::lerna publish failed (exit $status), not only with provenance 409s"
  exit "$status"
fi

for p in $failed; do
  echo "::warning::$p: npm provenance answered 409 for this version; it and the packages that depend on it stay on their previous version"
done
{
  echo "### Packages npm provenance refused (409)"
  echo
  echo "$failed" | sed 's/^/- /'
  echo
  echo "These and the packages that depend on them were not published at this version. A later release publishes them; a \`Release-As:\` footer publishes every package."
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit 0
