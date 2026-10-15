##
# Build stage
##
FROM golang:1.25 AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/medianode ./cmd/medianode

##
# Run stage: static binary, no shell
##
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /out/medianode /medianode

# SIP (UDP and TCP) and the RTP range. The range is whatever the node hands out; publish the same
# range you configure (see docs/operators/rebuild.md). Config comes from MEDIANODE_* variables or flags.
EXPOSE 5060/udp 5060/tcp

ENTRYPOINT ["/medianode"]
