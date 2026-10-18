##
# Build stage
##
# Pinned to a patched release by digest (M15); bump with go.mod's go line.
FROM golang:1.26.9@sha256:37cfcca63222ec499bec5e8ad7aad52dbf7529db36d5812b8eae2f0621aa92d6 AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/medianode ./cmd/medianode \
  && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/sipcaller ./cmd/sipcaller

##
# Run stage: static binary, no shell
##
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /out/medianode /medianode
# The SIP caller bot (test calls, the rebuild stack's smoke test): `--entrypoint /sipcaller`.
COPY --from=builder /out/sipcaller /sipcaller

# SIP (UDP and TCP) and the RTP range. The range is whatever the node hands out; publish the same
# range you configure (see docs/operators/rebuild.md). Config: /config/medianode.yaml (or -config
# <file>; flags win). MEDIANODE_* variables are not read: use ${VAR} placeholders in the file.
EXPOSE 5060/udp 5060/tcp

ENTRYPOINT ["/medianode"]
