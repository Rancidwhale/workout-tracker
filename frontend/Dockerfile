# syntax=docker/dockerfile:1

# React frontend image: static build served by unprivileged nginx on :8080.
#
#   docker build -t <registry>/workout-tracker-frontend:<tag> frontend/
#
# nginx proxies /api/* to BACKEND_URL (default http://backend:8000), so the
# image works unchanged in any environment that can reach the backend.

ARG NODE_VERSION=24
ARG NGINX_VERSION=1.29

# --- Build stage ---------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Baked in at build time. /api is served by this image's nginx, so the
# default works anywhere; override only to call a backend on another origin.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# --- Runtime stage -------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine

ENV BACKEND_URL=http://backend:8000
# Only substitute BACKEND_URL; leave nginx's own $variables alone.
ENV NGINX_ENVSUBST_FILTER=^BACKEND_URL$

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
