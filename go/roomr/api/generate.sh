#!/usr/bin/env bash
# Regenerates the Go code for the media node's protos (committed, so `go build` needs no protoc).
# Needs protoc and the two plugins at these versions (the committed code was generated with them; go.mod's newer protobuf and grpc runtimes accept it):
#   go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.36.8
#   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.5.1
set -euo pipefail
cd "$(dirname "$0")"
PATH="$(go env GOPATH)/bin:$PATH"
protoc -I . \
  --go_out=. --go_opt=paths=source_relative \
  --go-grpc_out=. --go-grpc_opt=paths=source_relative \
  roomr/v1/roomr.proto
# The TypeScript controller (@fonoster/common, roomr) loads a copy of the proto at run time; keep
# it identical (mods/common/test/roomr/roomrClient.test.ts checks).
cp roomr/v1/roomr.proto ../../../mods/common/src/protos/roomr.proto
