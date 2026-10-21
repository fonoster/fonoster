#!/bin/sh
# Builds @fonoster/common when PROVE_FILES touches it: Autopilot runs from source but reads common
# (the agent schema) from its build. prove.sh runs it with the fault applied; the area's reset:
# runs it again after the fault is reverted.
set -eu
case " ${PROVE_FILES:-} " in
  *" mods/common/"*) npm run build --silent -w @fonoster/common >/dev/null ;;
esac
