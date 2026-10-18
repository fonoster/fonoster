##
# Build stage: cgo with a statically linked libopus (internal/audio/opus.go), cross-compiled on
# the build platform for each target (linux/amd64, linux/arm64) instead of under emulation.
##
# Pinned to a patched release by digest (M15); bump with go.mod's go line. The digest is the
# multi-arch index, so --platform picks the build platform's image.
FROM --platform=$BUILDPLATFORM golang:1.26.9@sha256:37cfcca63222ec499bec5e8ad7aad52dbf7529db36d5812b8eae2f0621aa92d6 AS builder
LABEL team="Fonoster Team <team@fonoster.com>"
ARG TARGETARCH
ARG BUILDARCH

# The target's C toolchain (the native gcc when not crossing).
RUN set -eux; \
  case "$TARGETARCH" in \
    amd64) triple=x86_64-linux-gnu ;; \
    arm64) triple=aarch64-linux-gnu ;; \
    *) echo "unsupported TARGETARCH $TARGETARCH"; exit 1 ;; \
  esac; \
  if [ "$TARGETARCH" != "$BUILDARCH" ]; then \
    apt-get update -qq; \
    apt-get install -y -qq --no-install-recommends "gcc-$(echo $triple | tr _ -)" "libc6-dev-$TARGETARCH-cross"; \
    rm -rf /var/lib/apt/lists/*; \
  fi; \
  echo "$triple" > /triple

# libopus from source, static, without the 1.5 neural extras (deep PLC, DRED, OSCE) that the
# distro packages turn on: they add ~3 MB of model weights per binary and the node does not use
# them (it runs Opus at 16 kHz, complexity 5, with in-band FEC).
ARG OPUS_VERSION=1.5.2
ARG OPUS_SHA256=65c1d2f78b9f2fb20082c38cbe47c951ad5839345876e46941612ee87f9a7ce1
RUN set -eux; \
  triple="$(cat /triple)"; cc=gcc; [ "$TARGETARCH" = "$BUILDARCH" ] || cc="$triple-gcc"; \
  curl -fsSL -o /tmp/opus.tar.gz "https://downloads.xiph.org/releases/opus/opus-$OPUS_VERSION.tar.gz"; \
  echo "$OPUS_SHA256  /tmp/opus.tar.gz" | sha256sum -c -; \
  mkdir /tmp/opus && tar -xzf /tmp/opus.tar.gz -C /tmp/opus --strip-components=1; \
  cd /tmp/opus; \
  CC="$cc" ./configure --host="$triple" --prefix=/opt/opus --enable-static --disable-shared \
    --disable-doc --disable-extra-programs --disable-deep-plc --disable-dred --disable-osce; \
  make -j"$(nproc)" install; \
  rm -rf /tmp/opus /tmp/opus.tar.gz; \
  echo "$cc" > /cc

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# The version heartbeats report (media-control "Heartbeat").
ARG VERSION=dev
# Fully static binaries: libopus.a and libc linked in; netgo and osusergo keep glibc's NSS
# (resolver, user lookups) out, so the result runs on distroless/static.
RUN set -eux; \
  export CGO_ENABLED=1 GOOS=linux GOARCH="$TARGETARCH" CC="$(cat /cc)" \
    CGO_CFLAGS="-I/opt/opus/include" CGO_LDFLAGS="-L/opt/opus/lib"; \
  flags='-s -w -linkmode external -extldflags "-static"'; \
  go build -trimpath -tags netgo,osusergo -ldflags="$flags -X main.version=$VERSION" -o /out/roomr ./cmd/roomr; \
  go build -trimpath -tags netgo,osusergo -ldflags="$flags" -o /out/sipcaller ./cmd/sipcaller

##
# Run stage: static binary, no shell
##
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /out/roomr /roomr
# The SIP caller bot (test calls, the rebuild stack's smoke test): `--entrypoint /sipcaller`.
COPY --from=builder /out/sipcaller /sipcaller

# SIP (UDP and TCP) and the RTP range. The range is whatever the node hands out; publish the same
# range you configure (see docs/operators/rebuild.md). Config: /config/roomr.yaml (or -config
# <file>; flags win). ROOMR_* variables are not read: use ${VAR} placeholders in the file.
EXPOSE 5060/udp 5060/tcp

ENTRYPOINT ["/roomr"]
