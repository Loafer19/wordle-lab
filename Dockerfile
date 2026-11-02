# Build static site with Bun, serve with Caddy
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Caddy >= 2.11: 2.10.x answers precompressed (.br/.gz) files with a bogus 206 Partial Content (caddyserver/caddy#7250)
FROM caddy:2.11-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
