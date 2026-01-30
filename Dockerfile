# ---------- build ----------
FROM node:18-alpine AS build

WORKDIR /app

# 👇 ESTA ES LA CLAVE
ARG VITE_N8N_WEBHOOK_URL
ENV VITE_N8N_WEBHOOK_URL=$VITE_N8N_WEBHOOK_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
