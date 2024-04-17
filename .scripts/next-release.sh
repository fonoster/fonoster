#!/bin/bash

set -e

git fetch --tags

latest_tag=$(git describe --tags --abbrev=0)
latest_tag_timestamp=$(git rev-list -n 1 $latest_tag | xargs git show -s --format="%ct")
commit_messages=$(git log --pretty=format:"%s" $latest_tag..HEAD)
release_type="none"

while IFS= read -r line; do
  if echo "$line" | grep -q "^BREAKING CHANGE:" || echo "$line" | grep -q "!"; then
    release_type="major"
    break
  elif echo "$line" | grep -Eq "^feat\(?"; then
    release_type="minor"
  elif echo "$line" | grep -Eq "^(fix|refactor|perf|style|test|revert)\(?"; then
    if [ "$release_type" != "minor" ]; then
      release_type="patch"
    fi
  fi
done <<< "$commit_messages"

echo $release_type