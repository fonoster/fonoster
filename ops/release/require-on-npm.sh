#!/usr/bin/env bash
#
# require-on-npm.sh: fails the release when a package's version is not on npm, or doesn't install
# from it, after the publish steps (release.yaml). Production (`fonoster-deploy prepare`) and
# self-hosted installs (`fonoster-config init`) run `npx -p @fonoster/common@<version>`, so without
# it the release would publish images, a GitHub release and a deploy that can't install.
#
# A poll passes when `npm view` shows the version and a dry-run install of it succeeds in an empty
# project outside the repo. The dry run resolves the whole dependency tree, so a sibling the package
# depends on at a version npm lacks (logger@^0.35.0) fails it with ETARGET. The registry caches
# package metadata for 5 minutes, so it polls up to 6 times, REQUIRE_ON_NPM_DELAY seconds apart
# (default 60), with --prefer-online so npm revalidates its own cache on every poll.
#
#   ops/release/require-on-npm.sh @fonoster/common 0.35.0
set -uo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: ops/release/require-on-npm.sh <package> <version>" >&2
  exit 2
fi
package="$1"
version="$2"

errors=""
for i in 1 2 3 4 5 6; do
  if [ "$(npm view --prefer-online "$package@$version" version 2>/dev/null)" = "$version" ]; then
    project="$(mktemp -d)"
    echo '{}' > "$project/package.json"
    if output="$(cd "$project" && npm install --dry-run --prefer-online --no-save --ignore-scripts --no-audit --no-fund "$package@$version" 2>&1)"; then
      rm -rf "$project"
      exit 0
    fi
    rm -rf "$project"
    errors="$(grep '^npm error' <<< "$output")"
  fi
  [ "$i" -lt 6 ] && sleep "${REQUIRE_ON_NPM_DELAY:-60}"
done

[ -n "$errors" ] && echo "$errors"
message="$package@$version is not installable from npm after the publish attempts. Production and self-hosted installs need it (fonoster-config init), so the release stops before images, the GitHub release and the deploy. Rerun with: gh workflow run release.yaml"
echo "::error::$message"
{
  echo "### $package@$version is not installable from npm"
  echo
  echo "$message"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit 1
