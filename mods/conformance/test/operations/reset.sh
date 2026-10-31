#!/bin/sh
# The area's reset: (mods/conformance/catalog/prove.cjs). A fault in a file the archive ships
# (ops/bundle/: OPS-001's init.sh, OPS-007's envoy-tls.yaml) was built into 0.0.0-a by prove.sh;
# once it is reverted, 0.0.0-a is built again, so later cases meet the archive as it ships.
set -eu
case " ${PROVE_FILES:-} " in
  *" ops/bundle/"*)
    rm -rf dist/release/0.0.0-a
    ops/release/bundle 0.0.0-a >&2
    ;;
esac
