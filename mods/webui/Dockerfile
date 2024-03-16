##
## Build and pack the service
##
FROM alpine:3.19 AS builder
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

WORKDIR /work
COPY mods/webui .

ARG NODE_ENV=production
ENV NODE_ENV ${NODE_ENV}

RUN apk add --no-cache git curl nodejs npm python3 make cmake g++ \
  && npm install --omit=dev \
  && npm run build

##
## Runner
##
# Production image, copy all the files and run next
FROM alpine:3.19 AS runner
WORKDIR /service

ARG APP_ENV=production
ARG NODE_ENV=production
ARG PORT=8181
ARG HOST=0.0.0.0

ENV APP_ENV=${APP_ENV} \
  NODE_ENV=${NODE_ENV} \
  PORT=${PORT} \
  HOST=${HOST}

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

RUN mkdir -p /work/.next/cache/images && chown nextjs:nodejs /work/.next/cache/images
VOLUME /work/.next/cache/images

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /work/next.config.js ./
COPY --from=builder /work/public ./public
COPY --from=builder --chown=nextjs:nodejs /work/.next ./.next
COPY --from=builder /work/node_modules ./node_modules
COPY --from=builder /work/package.json ./package.json

RUN apk add --no-cache nodejs

USER nextjs

EXPOSE ${PORT}

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

CMD sh -c "PORT=\$PORT node_modules/.bin/next start"
