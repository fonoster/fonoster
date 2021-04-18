#!/usr/bin/env sh
DIRNAME="$(cd "$(dirname "$0")"; pwd)"

# callmanager common storage providers numbers domains agents usermanager
PROTOS=(storage)

for proto in "${PROTOS[@]}"
do
  grpc_tools_node_protoc -I=. /$DIRNAME/../mods/${proto}/src/protos/$proto.proto \
    --proto_path=$DIRNAME/../mods/${proto}/src/protos \
    --js_out=import_style=commonjs,binary:$DIRNAME/../mods/${proto}/src/service/protos \
    --grpc_out=$DIRNAME/../mods/${proto}/src/service/protos \
    --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`

  # generate d.ts codes
  grpc_tools_node_protoc -I=. /$DIRNAME/../mods/${proto}/src/protos/$proto.proto \
    --proto_path=$DIRNAME/../mods/${proto}/src/protos \
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
    --ts_out=$DIRNAME/../mods/${proto}/src/service/protos
done
