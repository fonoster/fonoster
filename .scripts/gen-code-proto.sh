#!/bin/bash

set -e

DIRNAME="$(cd "$(dirname "$0")"; pwd)"
OUT_DIR=$DIRNAME/../mods/sdk/src/generated

echo "Generating code for protos"

mkdir -p $OUT_DIR

protoc -I=. $DIRNAME/../mods/common/src/protos/agents.proto \
  -I=. $DIRNAME/../mods/common/src/protos/domains.proto \
  -I=$DIRNAME/../mods/common/src/protos/ \
  --js_out=import_style=commonjs:$OUT_DIR \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:$OUT_DIR
