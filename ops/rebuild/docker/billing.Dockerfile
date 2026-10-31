##
# The billing service (mods/billing): rating, the credit ledger, admission (Authz) and Stripe.
# Fonoster Cloud only: released as fonoster/billing (ops/release/images.json) and run by the bundle's
# opt-in compose.billing.yaml; installs without it don't run it. The rate cards are inside the
# image, at /work/mods/billing/rate-cards.
#
#   docker build -f ops/rebuild/docker/billing.Dockerfile .
##
FROM node:22-slim AS builder
WORKDIR /work
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json lerna.json tsconfig.json ./
# @fonoster/billing imports authz (and through it identity), common and logger.
COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/identity ./mods/identity
COPY mods/authz ./mods/authz
COPY mods/billing ./mods/billing
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/billing --include-workspace-root --ignore-scripts --no-audit --no-fund
RUN (cd mods/identity && npx prisma generate --schema schema.prisma) \
  && (cd mods/billing && npx prisma generate --schema schema.prisma) \
  && for p in types logger common identity authz; do (cd mods/$p && npx tsc -b); done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && (cd mods/identity && node scripts/copy-assets.cjs) \
  && (cd mods/billing && npx tsc -b && node scripts/copy-assets.cjs)

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/* \
  && groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser
WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
# The workspace packages that node_modules links to.
COPY --from=builder --chown=appuser:appuser /work/mods ./mods
USER appuser
EXPOSE 50071 50072 50073
# Migrations run first, then the service (billing.yaml at /etc/fonoster/billing.yaml).
CMD ["sh", "-c", "cd /work/mods/billing && npx prisma migrate deploy --schema schema.prisma && node dist/main.js --config /etc/fonoster/billing.yaml"]
