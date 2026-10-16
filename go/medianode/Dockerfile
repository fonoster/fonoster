##
# Build stage
##
FROM golang:1.25 AS builder
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
# <file>; flags win). MEDIANODE_* variables still work but are deprecated.
EXPOSE 5060/udp 5060/tcp

ENTRYPOINT ["/medianode"]
