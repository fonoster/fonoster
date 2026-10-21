#!/bin/sh
# Builds the packages whose built output a case runs (the standalone Identity server and the
# identity client) when PROVE_FILES touches them. prove.sh runs it with the fault applied; the
# area's reset: runs it again after the fault is reverted.
set -eu
for pkg in identity identity-client; do
  case " ${PROVE_FILES:-} " in
    *" mods/$pkg/"*) npm run build --silent -w "@fonoster/$pkg" >/dev/null ;;
  esac
done
