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

# Root package files
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/node_modules ./node_modules

# API app
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

# Packages — each needs dist/ + node_modules/ + package.json
COPY --from=build /app/packages/db/package.json ./packages/db/package.json
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules

COPY --from=build /app/packages/types/package.json ./packages/types/package.json
COPY --from=build /app/packages/types/dist ./packages/types/dist

COPY --from=build /app/packages/validators/package.json ./packages/validators/package.json
COPY --from=build /app/packages/validators/dist ./packages/validators/dist
COPY --from=deps /app/packages/validators/node_modules ./packages/validators/node_modules

COPY --from=build /app/packages/email/package.json ./packages/email/package.json
COPY --from=build /app/packages/email/dist ./packages/email/dist
COPY --from=deps /app/packages/email/node_modules ./packages/email/node_modules

COPY --from=build /app/packages/storage/package.json ./packages/storage/package.json
COPY --from=build /app/packages/storage/dist ./packages/storage/dist
COPY --from=deps /app/packages/storage/node_modules ./packages/storage/node_modules

COPY --from=build /app/packages/config/package.json ./packages/config/package.json

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
