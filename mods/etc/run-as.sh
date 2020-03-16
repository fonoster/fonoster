#!/usr/bin/env sh
cd /mods && node core/src/server/server.js
while sleep 3600; do :; done
