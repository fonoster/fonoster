#!/usr/bin/env bash
#
# require-on-npm.sh: fails the release when a package's version is not on npm after the publish
# steps (release.yaml). Production (`fonoster-deploy prepare`) and self-hosted installs
# (`fonoster-config init`) run `npx -p @fonoster/common@<version>`, so without it the release
# would publish images, a GitHub release and a deploy that can't install.
#
# npm can take a few seconds to show a version it just accepted, so it polls `npm view` up to 6
# times, REQUIRE_ON_NPM_DELAY seconds apart (default 10).
#
#   ops/release/require-on-npm.sh @fonoster/common 0.35.0
set -uo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: ops/release/require-on-npm.sh <package> <version>" >&2
  exit 2
fi
package="$1"
version="$2"

for i in 1 2 3 4 5 6; do
  [ "$(npm view "$package@$version" version 2>/dev/null)" = "$version" ] && exit 0
  [ "$i" -lt 6 ] && sleep "${REQUIRE_ON_NPM_DELAY:-10}"
done

message="$package@$version is not on npm after the publish attempts. Production and self-hosted installs need it (fonoster-config init), so the release stops before images, the GitHub release and the deploy. Rerun with: gh workflow run release.yaml"
echo "::error::$message"
{
  echo "### $package@$version did not publish"
  echo
  echo "$message"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit 1
