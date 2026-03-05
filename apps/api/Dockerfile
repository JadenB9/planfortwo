FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/validators/package.json ./packages/validators/
COPY packages/config/package.json ./packages/config/
COPY packages/email/package.json ./packages/email/
COPY packages/storage/package.json ./packages/storage/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS build
COPY . .
RUN pnpm --filter @planfortwo/api build

# Production
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/*/dist ./packages/

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
