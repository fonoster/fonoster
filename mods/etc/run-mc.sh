#!/usr/bin/env sh
cd /mods && node dispatcher/src/dispatcher.js
while sleep 3600; do :; done
