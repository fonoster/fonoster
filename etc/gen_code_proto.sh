#!/usr/bin/env sh
DIRNAME="$(cd "$(dirname "$0")"; pwd)"

PROTOS=(agents callmanager domains storage numbers providers funcs auth secrets)

for proto in "${PROTOS[@]}"
do
  grpc_tools_node_protoc -I=. /$DIRNAME/../mods/core/src/protos/common.proto \
    -I=. /$DIRNAME/../mods/${proto}/src/protos/${proto}.proto \
    --proto_path=$DIRNAME/../mods/core/src/protos \
    --proto_path=$DIRNAME/../mods/${proto}/src/protos \
    --js_out=import_style=commonjs,binary:$DIRNAME/../mods/${proto}/src/service/protos \
    --grpc_out=$DIRNAME/../mods/${proto}/src/service/protos \
    --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`

  # generate d.ts codes
  grpc_tools_node_protoc -I=. /$DIRNAME/../mods/core/src/protos/common.proto \
    -I=. /$DIRNAME/../mods/${proto}/src/protos/${proto}.proto \
    --proto_path=$DIRNAME/../mods/core/src/protos \
    --proto_path=$DIRNAME/../mods/${proto}/src/protos \
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
    --ts_out=$DIRNAME/../mods/${proto}/src/service/protos
done

# Cleaning callmanager and auth stubs
rm $DIRNAME/../mods/callmanager/src/service/protos/common_*
rm $DIRNAME/../mods/auth/src/service/protos/common_*