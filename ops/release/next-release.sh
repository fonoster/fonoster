#!/bin/bash

set -e

git fetch --tags

latest_tag=$(git describe --tags --abbrev=0 --match "v[0-9]*")
latest_tag_timestamp=$(git rev-list -n 1 $latest_tag | xargs git show -s --format="%ct")
commit_messages=$(git log --pretty=format:"%s" $latest_tag..HEAD)
release_type="none"

# A "Release-As: x.y.z" footer in any commit since the last tag pins the
# version (lerna publish takes it in place of major/minor/patch).
release_as=$(git log --format=%B $latest_tag..HEAD | sed -nE 's/^Release-As: *([0-9]+\.[0-9]+\.[0-9]+) *$/\1/p' | head -n 1)
if [ -n "$release_as" ]; then
  echo "$release_as"
  exit 0
fi

while IFS= read -r line; do
  if echo "$line" | grep -q "^BREAKING CHANGE:" || echo "$line" | grep -qE "^[a-z]+(\([^)]*\))?!:"; then
    release_type="major"
    break
  elif echo "$line" | grep -Eq "^feat(\(|:)"; then
    release_type="minor"
  elif echo "$line" | grep -Eq "^(fix|refactor|perf|revert)(\(|:)"; then
    if [ "$release_type" != "minor" ]; then
      release_type="patch"
    fi
  fi
done <<< "$commit_messages"

echo $release_type