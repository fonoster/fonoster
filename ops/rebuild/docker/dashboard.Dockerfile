##
# The dashboard with this checkout's SDK (ops/rebuild). The release image
# (mods/dashboard/Dockerfile) takes @fonoster/sdk from npm, which predates GetCapabilities and
# fails its own check (ST-B2). Same nginx runtime and DASHBOARD_API_URL contract.
#
#   docker build -f ops/rebuild/docker/dashboard.Dockerfile .
##
FROM node:22-slim AS build
WORKDIR /work
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/sdk ./mods/sdk
COPY mods/dashboard ./mods/dashboard
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/dashboard --workspace @fonoster/sdk \
      --ignore-scripts --no-audit --no-fund
# The SDK's browser build (rollup), then the dashboard against it (the vite alias resolves
# @fonoster/sdk to the workspace package).
RUN cd mods/types && npx tsc -b \
  && cd ../sdk && npx rollup -c rollup.config.mjs \
  && cd ../dashboard && npx vite build \
  && grep -qr "fonoster.capabilities.v1beta2" dist/assets

FROM nginx:1.27-alpine
COPY --from=build /work/mods/dashboard/dist /usr/share/nginx/html
COPY mods/dashboard/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY mods/dashboard/nginx/40-fonoster-config.sh /docker-entrypoint.d/40-fonoster-config.sh
RUN rm -f /usr/share/nginx/html/config.js \
  && chmod +x /docker-entrypoint.d/40-fonoster-config.sh
EXPOSE 3030
