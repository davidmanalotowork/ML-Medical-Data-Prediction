FROM node:20-alpine AS build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG VITE_API_URL=/api
ARG VITE_PYTHON_ML_API=/ml
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_PYTHON_ML_API=${VITE_PYTHON_ML_API}

RUN npm run build

FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/frontend/dist /srv

EXPOSE 80 443 443/udp
