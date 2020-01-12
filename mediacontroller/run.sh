#!/usr/bin/env sh
cd /yaps/dispatcher && node dispatcher.js
while sleep 3600; do :; done
