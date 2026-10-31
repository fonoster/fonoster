##
# The dashboard with this checkout's SDK (ops/rebuild). The release image
# (mods/dashboard/Dockerfile) takes @fonoster/sdk from npm, which predates GetCapabilities and
# fails its own check (ST-B2). Same nginx runtime and DASHBOARD_API_URL contract.
#
#   docker build -f ops/rebuild/docker/dashboard.Dockerfile .
##
FROM node:22-slim AS build
WORKDIR /work
# Manifests before sources, so the install layer is reused until package-lock.json or one of
# these package.json files changes. No @fonoster package may come from the registry except roomr
# (a package.json missing here would).
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/types/package.json ./mods/types/
COPY mods/logger/package.json ./mods/logger/
COPY mods/common/package.json ./mods/common/
COPY mods/sdk/package.json ./mods/sdk/
COPY mods/dashboard/package.json ./mods/dashboard/
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/dashboard --workspace @fonoster/sdk \
      --workspace @fonoster/common --ignore-scripts --no-audit --no-fund \
  && for d in node_modules/@fonoster/*; do [ -L "$d" ] || [ "${d##*/}" = roomr ] || { echo "$d came from the npm registry, not the workspace"; exit 1; }; done \
  && ls mods/*/package.json > /tmp/install-manifests
COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/sdk ./mods/sdk
COPY mods/dashboard ./mods/dashboard
# A package.json that came only with the sources would leave the install layer blind to it.
RUN [ "$(ls mods/*/package.json)" = "$(cat /tmp/install-manifests)" ] \
  || { echo "copy each mods/<package>/package.json before npm install"; exit 1; }
# The SDK's browser build (rollup), then the dashboard against it (the vite alias resolves
# @fonoster/sdk to the workspace package). The SDK imports @fonoster/common's types, and its build
# fails on a type error, so common's declarations are built first.
RUN cd mods/types && npx tsc -b \
  && cd ../common && npx tsc -b \
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
