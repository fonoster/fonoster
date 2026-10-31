##
# The region agent of a region (public or private, add-private-regions task 3, PR-13, PR-21):
# `fonoster-region enroll`, `secrets` and `run` (`fonoster-regions` is a deprecated alias). The image also carries the apiserver schema and migrations: a cell has no
# apiserver, so `run` applies them to the cell's database first (RC-B6).
##
FROM node:22-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Manifests before sources, so the install layer is reused until package-lock.json or one of
# these package.json files changes.
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/types/package.json ./mods/types/
COPY mods/logger/package.json ./mods/logger/
COPY mods/common/package.json ./mods/common/
COPY mods/callrecord/package.json ./mods/callrecord/
COPY mods/region-agent/package.json ./mods/region-agent/

# Only the region agent's workspace closure; no @fonoster package may come from the registry except
# roomr (a package.json missing above would).
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/region-agent --include-workspace-root --ignore-scripts --no-audit --no-fund \
  && for d in node_modules/@fonoster/*; do [ -L "$d" ] || [ "${d##*/}" = roomr ] || { echo "$d came from the npm registry, not the workspace"; exit 1; }; done \
  && ls mods/*/package.json > /tmp/install-manifests

COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/callrecord ./mods/callrecord
COPY mods/region-agent ./mods/region-agent
COPY mods/apiserver/schema.prisma ./mods/apiserver/schema.prisma
COPY mods/apiserver/migrations ./mods/apiserver/migrations
# A package.json that came only with the sources would leave the install layer blind to it.
RUN [ "$(ls mods/*/package.json)" = "$(cat /tmp/install-manifests)" ] \
  || { echo "copy each mods/<package>/package.json before npm install"; exit 1; }

RUN for p in types logger common callrecord region-agent; do \
      (cd mods/$p && npx tsc -b) || exit 1; \
    done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/region-agent \
  && npx -y prisma@6.19.3 generate --schema mods/apiserver/schema.prisma \
  && find node_modules -name "*.map" -type f -delete

##
# Run stage
##
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g prisma@6.19.3 \
  && groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser \
  && mkdir -p /var/lib/fonoster-region /var/lib/fonoster-secrets \
  && chown appuser:appuser /var/lib/fonoster-region /var/lib/fonoster-secrets

WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /work/mods ./mods
COPY --chown=appuser:appuser mods/region-agent/entrypoint.sh /usr/local/bin/fonoster-region-entrypoint
RUN ln -s /work/mods/region-agent/dist/cli.js /usr/local/bin/fonoster-regions \
  && ln -s /work/mods/region-agent/dist/cli.js /usr/local/bin/fonoster-region \
  && chmod +x /work/mods/region-agent/dist/cli.js /usr/local/bin/fonoster-region-entrypoint

USER appuser
ENV FONOSTER_REGION_DATA_DIR=/var/lib/fonoster-region \
    FONOSTER_REGION_CONFIG=/etc/fonoster/region-agent.yaml
VOLUME /var/lib/fonoster-region

# `enroll <token>`, `secrets …`, `status` run the CLI; `run` (the default) migrates, then serves.
ENTRYPOINT ["fonoster-region-entrypoint"]
CMD ["run"]
