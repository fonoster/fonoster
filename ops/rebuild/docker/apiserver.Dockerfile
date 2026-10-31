##
# The API server (with its embedded Identity) built from this checkout's workspace packages, for
# the rebuild stack (ops/rebuild). The release image (mods/apiserver/Dockerfile) installs
# @fonoster/* from npm, which does not have the unreleased rebuild packages (ST-B2).
#
#   docker build -f ops/rebuild/docker/apiserver.Dockerfile .
##
FROM node:22-slim AS builder
WORKDIR /work
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Manifests before sources, so the install layer is reused until package-lock.json or one of
# these package.json files changes.
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/types/package.json ./mods/types/
COPY mods/logger/package.json ./mods/logger/
COPY mods/common/package.json ./mods/common/
COPY mods/identity/package.json ./mods/identity/
COPY mods/authz/package.json ./mods/authz/
COPY mods/sipnet/package.json ./mods/sipnet/
COPY mods/callrecord/package.json ./mods/callrecord/
COPY mods/voice/package.json ./mods/voice/
COPY mods/community/package.json ./mods/community/
COPY mods/autopilot/package.json ./mods/autopilot/
COPY mods/apiserver/package.json ./mods/apiserver/

# Only the apiserver's workspace closure (not the whole monorepo); no @fonoster package may come
# from the registry except roomr (a package.json missing above would).
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/apiserver --ignore-scripts --no-audit --no-fund \
  && for d in node_modules/@fonoster/*; do [ -L "$d" ] || [ "${d##*/}" = roomr ] || { echo "$d came from the npm registry, not the workspace"; exit 1; }; done \
  && ls mods/*/package.json > /tmp/install-manifests

# autopilot's `tsc -b` also builds community (a project reference).
COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/identity ./mods/identity
COPY mods/authz ./mods/authz
COPY mods/sipnet ./mods/sipnet
COPY mods/callrecord ./mods/callrecord
COPY mods/voice ./mods/voice
COPY mods/community ./mods/community
COPY mods/autopilot ./mods/autopilot
COPY mods/apiserver ./mods/apiserver
# A package.json that came only with the sources would leave the install layer blind to it.
RUN [ "$(ls mods/*/package.json)" = "$(cat /tmp/install-manifests)" ] \
  || { echo "copy each mods/<package>/package.json before npm install"; exit 1; }

RUN npx prisma generate --schema mods/apiserver/schema.prisma \
  && npx prisma generate --schema mods/identity/schema.prisma

RUN for p in types logger common identity authz sipnet callrecord voice autopilot apiserver; do \
      (cd mods/$p && npx tsc -b) || exit 1; \
    done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && node mods/identity/scripts/copy-assets.cjs

##
# Run stage
##
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g prisma@6.19.3 \
  && groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser

WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /work/mods ./mods

# Where the entrypoint looks for migrations (--migrations-root /service).
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/migrations /service/core/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/schema.prisma /service/core/schema.prisma
COPY --from=builder --chown=appuser:appuser /work/mods/identity/migrations /service/identity/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/identity/schema.prisma /service/identity/schema.prisma

# The first user of an install: docker compose exec -T apiserver fonoster-owner create <email> < pw
RUN chmod +x /work/mods/apiserver/dist/bin/owner.js \
  && ln -s /work/mods/apiserver/dist/bin/owner.js /usr/local/bin/fonoster-owner

USER appuser
WORKDIR /service

# Reads /config/fonoster.yaml (or /opt/fonoster/fonoster.yaml), waits for Postgres, applies the core and identity
# migrations, seeds, then starts.
CMD ["node", "/work/mods/apiserver/dist/bin/entrypoint.js", "--migrations-root", "/service"]
