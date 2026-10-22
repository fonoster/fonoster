#!/bin/sh
# Builds @fonoster/voice when PROVE_FILES touches it: the suites run AppBridge and Autopilot from
# source but the TypeScript SDK from its build. prove.sh runs it with the fault applied; the area's
# reset: runs it again after the fault is reverted.
set -eu
case " ${PROVE_FILES:-} " in
  *" mods/voice/"*) npm run build --silent -w @fonoster/voice >/dev/null ;;
esac
