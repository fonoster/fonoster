#!/bin/sh
# Runs one Operations case (catalog area OPS) and writes its JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh OPS-004 /tmp/prove-x
# Run from the repository root. OPS-001 is checked by ops/bundle/test/install.sh, every other case
# by ops/ansible/test/throwaway.sh, so only that suite runs. Both reuse dist/release/0.0.0-a when
# it is there: a fault in a file the archive ships (ops/bundle/) needs 0.0.0-a built again with
# the fault in it, so the build is removed first (the area's reset builds it again without it).
set -u
id="$1"
out="$2"
case " ${PROVE_FILES:-} " in
  *" ops/bundle/"*) rm -rf dist/release/0.0.0-a ;;
esac
case "$id" in
  OPS-001) JUNIT_DIR="$out" bash ops/bundle/test/install.sh 0.0.0-a ;;
  *) JUNIT_DIR="$out" bash ops/ansible/test/throwaway.sh 0.0.0-a 0.0.0-b --rollback ;;
esac
