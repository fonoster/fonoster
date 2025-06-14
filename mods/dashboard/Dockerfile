FROM node:20-alpine AS dev-deps
COPY . /app
WORKDIR /app
RUN npm install

FROM node:20-alpine AS prod-deps
COPY ./package.json /app/
WORKDIR /app
RUN npm install --omit=dev

FROM node:20-alpine AS build
ARG DASHBOARD_VERSION
COPY . /app/
COPY --from=dev-deps /app/node_modules /app/node_modules
WORKDIR /app
ENV DASHBOARD_VERSION=$DASHBOARD_VERSION
RUN npm run build

FROM node:20-alpine
COPY ./package.json /app/
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
WORKDIR /app
CMD ["npm", "start"]