#!/usr/bin/env sh
cd /dispatcher && node dispatcher.js
while sleep 3600; do :; done
