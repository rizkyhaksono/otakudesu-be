# Bun installs and builds; Node runs the standalone server.
#
# Bun is much faster for dependency resolution and script running, while Next.js
# officially targets the Node.js runtime for `server.js` — so each tool is used
# where it is actually better.

FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Only needed so the build can resolve config; the real value is supplied at
# runtime. Deliberately NOT a build ARG — baking configuration into the image
# means every environment needs its own rebuild.
ENV ANIME_BASE_URL=https://otakudesu.blog
RUN bun run build

FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Bypass the Node image's docker-entrypoint.sh entirely.
ENTRYPOINT ["node"]
CMD ["server.js"]
