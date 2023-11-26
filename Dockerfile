##
## Build and pack the service
##
FROM node:lts-alpine as builder

COPY mods/apiserver /work
WORKDIR /work

RUN apk add --no-cache --update git npm curl bash git tini npm python3 make cmake g++ \
  && npm install --production

##  
## Runner
##
FROM node:lts-alpine as runner
ENV USER=fonoster
ENV GID=1000
ENV UID=1000
ENV HOME=/home/fonoster

WORKDIR /service

COPY --from=builder /work/dist dist
COPY --from=builder /work/node_modules node_modules
COPY --from=builder /work/package.json package.json
COPY ./mods/apiserver/etc/service_envs.json /home/fonoster/service_envs.json
COPY ./mods/apiserver/etc/rbac.json /home/fonoster/rbac.json

RUN apk add --no-cache --update git tini \
  && echo "[]" > /home/fonoster/limiter.json \
  && apk del npm git \
  && rm -rf /var/cache/apk/*

RUN addgroup -g ${GID} ${USER} && adduser \
    --disabled-password \
    --gecos "" \
    --ingroup "$USER" \
    --home ${HOME} \
    --uid "$UID" \
    "$USER"

# Re-mapping the signal from 143 to 0
ENTRYPOINT ["tini", "-v", "-e", "143", "--"]
CMD ["node", "./dist/index"]
