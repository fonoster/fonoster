#!/bin/sh
# The area's reset: (mods/conformance/catalog/prove.cjs). A fault in a bundle config (DSH-063:
# Routr's) reaches the running stack through `ops/rebuild/stack reconfigure`; once it is reverted,
# this renders the configs again, so later cases meet the stack as it ships.
set -eu
case " ${PROVE_FILES:-} " in
  *" ops/bundle/config/"*)
    [ -f ops/rebuild/.local/stack.env ] && ops/rebuild/stack reconfigure >&2
    ;;
esac
