#!/usr/bin/env sh
cd /yaps && node dispatcher/dispatcher.js
while sleep 3600; do :; done
