#!/bin/bash

set -e

DIRNAME="$(cd "$(dirname "$0")"; pwd)"
ROOT="$DIRNAME/../../.."
PROTOS="$ROOT/mods/common/src/protos"
OUT_DIR_NODE=$DIRNAME/../src/generated/node
OUT_DIR_WEB=$DIRNAME/../src/generated/web
BIN="$ROOT/node_modules/.bin"

FILES="acls agents applications calls capabilities credentials domains identity numbers secrets trunks webhooks providers"
PROTO_FILES=""
for f in $FILES; do PROTO_FILES="$PROTO_FILES $PROTOS/$f.proto"; done

echo "Generating code for protos"

mkdir -p $OUT_DIR_NODE
mkdir -p $OUT_DIR_WEB

# Node.js
protoc -I=$PROTOS $PROTO_FILES \
  --js_out=import_style=commonjs,binary:$OUT_DIR_NODE \
  --grpc_out=grpc_js:$OUT_DIR_NODE \
  --plugin=protoc-gen-grpc=$(which grpc_tools_node_protoc_plugin) \
  --plugin=protoc-gen-ts=$BIN/protoc-gen-ts

# Browser
protoc -I=$PROTOS $PROTO_FILES \
  --js_out=import_style=commonjs:$OUT_DIR_WEB \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:$OUT_DIR_WEB \
  --plugin=protoc-gen-ts=$BIN/protoc-gen-ts
