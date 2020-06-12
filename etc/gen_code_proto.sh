#!/usr/bin/env sh
DIRNAME="$(cd "$(dirname "$0")"; pwd)"

#PROTOS=(appmanager common storage providers numbers domains agents)
PROTOS=(storage)

for proto in "${PROTOS[@]}"
do
  grpc_tools_node_protoc -I=. /$DIRNAME/../mods/core/src/protos/$proto.proto \
    --proto_path=$DIRNAME/../mods/core/src/protos \
    --js_out=import_style=commonjs,binary:$DIRNAME/../mods/core/src/server/protos \
    --grpc_out=$DIRNAME/../mods/core/src/server/protos \
    --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`

  # generate d.ts codes
  grpc_tools_node_protoc -I=. /$DIRNAME/../mods/core/src/protos/$proto.proto \
    --proto_path=$DIRNAME/../mods/core/src/protos \
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
    --ts_out=$DIRNAME/../mods/core/src/server/protos
done
