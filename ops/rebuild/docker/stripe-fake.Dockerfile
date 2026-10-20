##
# The Stripe fake (mods/stripe-fake): Stripe's API subset for billing, the /_fake control API and
# the viewer, on :12111. Test deployments only.
#
#   docker build -f ops/rebuild/docker/stripe-fake.Dockerfile .
##
FROM node:22-slim AS builder
WORKDIR /work
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/stripe-fake ./mods/stripe-fake
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/stripe-fake --include-workspace-root --ignore-scripts --no-audit --no-fund
RUN (cd mods/stripe-fake && npx tsc -b && npx vite build --config viewer/vite.config.ts --logLevel warn) \
  && npm prune --omit=dev --workspace @fonoster/stripe-fake --include-workspace-root

FROM node:22-slim
RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser
WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
# The package with its own node_modules (dependencies not hoisted to the root).
COPY --from=builder --chown=appuser:appuser /work/mods/stripe-fake ./mods/stripe-fake
USER appuser
ENV STRIPE_FAKE_PORT=12111
EXPOSE 12111
CMD ["node", "/work/mods/stripe-fake/dist/main.js"]
