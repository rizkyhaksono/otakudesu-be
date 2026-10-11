# Bun runs the TypeScript source directly: no build step, no Node runtime.

FROM oven/bun:1.4-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    TMPDIR=/tmp

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY public ./public
COPY src ./src

# The base image ships an unprivileged `bun` user.
USER bun
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/server.ts"]
