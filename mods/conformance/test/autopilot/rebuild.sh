#!/bin/sh
# Builds @fonoster/common and @fonoster/appbridge when PROVE_FILES touches them: Autopilot runs from
# source but reads common (the agent schema) and the full-stack cases' AppBridge from their builds.
# prove.sh runs it with the fault applied; the area's reset: runs it again after the fault is
# reverted.
set -eu
case " ${PROVE_FILES:-} " in
  *" mods/common/"*) npm run build --silent -w @fonoster/common >/dev/null ;;
esac
case " ${PROVE_FILES:-} " in
  *" mods/appbridge/"*) npm run build --silent -w @fonoster/appbridge >/dev/null ;;
esac
