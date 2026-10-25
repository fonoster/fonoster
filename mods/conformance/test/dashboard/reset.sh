#!/bin/sh
# The area's reset: (mods/conformance/catalog/prove.cjs). A fault in the bundle (DSH-063: Routr's
# config; DSH-064: Envoy's HSTS in compose.yaml) reaches the running stack through
# `ops/rebuild/stack reconfigure`; once it is reverted, this renders the configs again and
# recreates what they change, so later cases meet the stack as it ships.
set -eu
case " ${PROVE_FILES:-} " in
  *" ops/bundle/"*)
    [ -f ops/rebuild/.local/stack.env ] && ops/rebuild/stack reconfigure >&2
    ;;
esac
