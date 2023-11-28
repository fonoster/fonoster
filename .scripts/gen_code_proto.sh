#!/usr/bin/env sh
DIRNAME="$(cd "$(dirname "$0")"; pwd)"

PROTOS=(
  monitor \
  agents \
  callmanager \
  domains \
  storage \
  numbers \
  providers \
  auth \
  secrets \
  users \
  projects \
  apps)

for proto in "${PROTOS[@]}"
do
  grpc_tools_node_protoc \
    -I=. $DIRNAME/../etc/vendor_protos/protoc-gen-openapiv2/options/annotations.proto \
    -I=. $DIRNAME/../etc/vendor_protos/protoc-gen-openapiv2/options/openapiv2.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/annotations.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/field_behavior.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/http.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/httpbody.proto \
    -I=. $DIRNAME/../mods/core/src/protos/common.proto \
    -I=. /$DIRNAME/../mods/${proto}/src/protos/${proto}.proto \
    -I=$DIRNAME/../etc/vendor_protos \
    -I=$DIRNAME/../mods/core/src/protos \
    -I=$DIRNAME/../mods/${proto}/src/protos \
    --js_out=import_style=commonjs,binary:$DIRNAME/../mods/${proto}/src/service/protos \
    --grpc_out=grpc_js:$DIRNAME/../mods/${proto}/src/service/protos \
    --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`

  # generate d.ts codes
  grpc_tools_node_protoc \
    -I=. $DIRNAME/../etc/vendor_protos/protoc-gen-openapiv2/options/annotations.proto \
    -I=. $DIRNAME/../etc/vendor_protos/protoc-gen-openapiv2/options/openapiv2.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/annotations.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/field_behavior.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/http.proto \
    -I=. $DIRNAME/../etc/vendor_protos/google/api/httpbody.proto \
    -I=. $DIRNAME/../mods/core/src/protos/common.proto \
    -I=. /$DIRNAME/../mods/${proto}/src/protos/${proto}.proto \
    -I=$DIRNAME/../etc/vendor_protos \
    -I=$DIRNAME/../mods/core/src/protos \
    -I=$DIRNAME/../mods/${proto}/src/protos \
    --proto_path=$DIRNAME/../mods/core/src/protos \
    --proto_path=$DIRNAME/../mods/${proto}/src/protos \
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
    --ts_out=grpc_js:$DIRNAME/../mods/${proto}/src/service/protos
done
