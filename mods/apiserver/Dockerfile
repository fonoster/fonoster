##
# Build stage
##
FROM node:22-slim AS builder 
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work

COPY package.json package-lock.json lerna.json ./
COPY mods ./mods
COPY tsconfig.json ./

RUN --mount=type=cache,target=/root/.npm \
    apt-get update && apt-get install -y git wget \
    && npm install --prefer-offline --no-audit \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm run build

# Runs from the workspace, so the image gets the sibling packages in this checkout and the
# lockfile's versions (with its overrides), not the published ones: a dependency both sides pin
# differently would otherwise be installed twice (two @grpc/grpc-js copies break credentials).
# The Prisma clients (postinstall, then `npm run build` copies identity's into its dist) are
# outside the pruned dependency tree and stay.
RUN npm prune --omit=dev --workspace @fonoster/apiserver --include-workspace-root \
  && test -d node_modules/.prisma/client \
  && test -d mods/identity/dist/generated/@prisma/client \
  && rm -rf mods/dashboard mods/*/test mods/*/.nyc_output mods/*/coverage

# Clean up unnecessary files from node_modules to reduce size
RUN cd /work/node_modules && \
  find . -name "*.map" -type f -delete 2>/dev/null || true && \
  find . -name "*.test.js" -o -name "*.test.ts" -o -name "*.spec.js" -o -name "*.spec.ts" -type f -delete 2>/dev/null || true && \
  find . -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name ".github" -o -name ".nyc_output" -o -name "coverage" -o -name "docs" -o -name "examples" \) -exec rm -rf {} + 2>/dev/null || true && \
  find . -name "*.md" -o -name "LICENSE" -o -name "CHANGELOG*" -type f -delete 2>/dev/null || true && \
  find . -name "*.ts" -not -path "*/node_modules/@types/*" -type f -delete 2>/dev/null || true

##
# Run stage
##
FROM node:22-slim

RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser

WORKDIR /service

COPY --from=builder --chown=appuser:appuser /work/package.json /work/package.json
COPY --from=builder --chown=appuser:appuser /work/node_modules /work/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods /work/mods
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/migrations ./core/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/schema.prisma ./core/schema.prisma
COPY --from=builder --chown=appuser:appuser /work/mods/identity/migrations ./identity/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/identity/schema.prisma ./identity/schema.prisma

RUN apt-get update && apt-get install -y ca-certificates \
  && npm install -g prisma@6.19.3 npm@latest \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && chmod +x /work/mods/apiserver/dist/bin/owner.js \
  && ln -s /work/mods/apiserver/dist/bin/owner.js /usr/local/bin/fonoster-owner

USER appuser

# The entrypoint reads /opt/fonoster/fonoster.yaml (or --config <path>), waits
# for Postgres, applies the core and identity migrations, seeds, then starts.
CMD ["node", "/work/mods/apiserver/dist/bin/entrypoint.js", "--migrations-root", "/service"]
