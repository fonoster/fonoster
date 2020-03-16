#!/usr/bin/env sh
DIRNAME="$(cd "$(dirname "$0")"; pwd)"

PROTOS=(appmanager common storage)

for proto in "${PROTOS[@]}"
do
  grpc_tools_node_protoc -I=. /$DIRNAME/../core/src/protos/$proto.proto \
    --proto_path=$DIRNAME/../core/src/protos \
    --js_out=import_style=commonjs,binary:$DIRNAME/../core/src/server/protos \
    --grpc_out=$DIRNAME/../core/src/server/protos \
    --plugin=protoc-gen-grpc=`which grpc_tools_node_protoc_plugin`
done
