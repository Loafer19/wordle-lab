# Build static site with Bun, serve with Caddy
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
RUN printf ':80 {\n  root * /srv\n  encode zstd gzip\n  header /assets/* Cache-Control "public, max-age=31536000, immutable"\n  try_files {path} /index.html\n  file_server\n}\n' > /etc/caddy/Caddyfile
EXPOSE 80
