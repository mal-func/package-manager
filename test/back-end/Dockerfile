# syntax=docker/dockerfile:1

# ---- deps: full install (incl. devDependencies) so `prisma generate`
# and the eventual `npm run build` type-check can run ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# ---- prod-deps: production dependencies only, for the final image ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=deps /app/generated ./generated
COPY package.json ./
COPY src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./

USER app
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "src/server.ts"]
