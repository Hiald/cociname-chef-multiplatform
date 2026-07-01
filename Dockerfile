# cociname-chef-multiplatform — Dockerfile (React/Vite → estático servido por nginx)
# Contexto de build = raíz del repo: cociname-chef-multiplatform/

# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Variables VITE (se HORNEAN en build-time; Vite las lee de process.env con prefijo VITE_).
# Pásalas con --build-arg en el docker build. Tienen defaults de Perú salvo las sensibles.
ARG VITE_COUNTRY_ID=1
ARG VITE_PHONE_PREFIX=51
ARG VITE_LEVEL3_LABEL=Distrito
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_TERMS_AND_CONDITIONS_URL
ENV VITE_COUNTRY_ID=$VITE_COUNTRY_ID \
    VITE_PHONE_PREFIX=$VITE_PHONE_PREFIX \
    VITE_LEVEL3_LABEL=$VITE_LEVEL3_LABEL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_TERMS_AND_CONDITIONS_URL=$VITE_TERMS_AND_CONDITIONS_URL
RUN npm run build

# ---- Runtime (nginx) ----
FROM nginx:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
