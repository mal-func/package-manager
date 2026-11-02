# syntax=docker/dockerfile:1

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# VITE_* vars are baked into the JS bundle at build time — they must be
# real, safe-for-the-browser values here, not placeholders, if this
# image is meant to be the actual deployable artifact. Passed as build
# args so the same Dockerfile works for any target environment.
ARG VITE_APP_NAME=CDIS
ARG VITE_APP_ENV=production
ARG VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---- runtime ----
FROM nginx:1.29-alpine AS runtime

# Runs as the (already-present, base-image) nginx user rather than root.
# setcap lets that unprivileged user still bind port 80 — the alternative,
# moving to an unprivileged port, would also require updating the
# reverse proxy's upstream target in the sibling cdis-deployment repo.
RUN apk add --no-cache libcap && \
    setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx && \
    apk del libcap

COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx

USER nginx

EXPOSE 80

# 127.0.0.1, not localhost: Alpine resolves localhost to ::1 first, and
# nginx.conf listens on IPv4 only, so "localhost" is refused and the
# container would report unhealthy forever despite serving fine.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/health || exit 1
