#!/bin/sh
# Builds the Stripe fake's viewer, which its Playwright cases run from viewer/dist, when PROVE_FILES
# touches it (or when called with "viewer"). prove.sh runs it with the fault applied; the area's
# reset: runs it again after the fault is reverted. The mocha cases run every package from source.
set -eu
case "${1:-} ${PROVE_FILES:-} " in
  viewer*|*" mods/stripe-fake/viewer/"*)
    (cd mods/stripe-fake && npx vite build --config viewer/vite.config.ts --logLevel warn) ;;
esac
