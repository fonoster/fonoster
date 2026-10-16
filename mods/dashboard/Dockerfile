FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx vite build \
  # The SDK comes from npm; fail if it predates GetCapabilities (0.27 and older).
  && grep -qr "fonoster.capabilities.v1beta2" dist/assets

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/40-fonoster-config.sh /docker-entrypoint.d/40-fonoster-config.sh
# Settings are written at start-up from DASHBOARD_API_URL; none are baked in.
RUN rm -f /usr/share/nginx/html/config.js \
  && chmod +x /docker-entrypoint.d/40-fonoster-config.sh
EXPOSE 3030
