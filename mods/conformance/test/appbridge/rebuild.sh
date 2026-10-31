#!/bin/sh
# Builds @fonoster/appbridge when PROVE_FILES touches its sources: signals.test.ts runs the built
# process (dist/main.js). prove.sh runs it with the fault applied; the area's reset: runs it again
# after the fault is reverted.
set -eu
case " ${PROVE_FILES:-} " in
  *" mods/appbridge/src/"*) npm run build --silent -w @fonoster/appbridge >/dev/null ;;
esac
