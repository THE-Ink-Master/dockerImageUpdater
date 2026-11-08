# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

# IMPORTANT: Node.js Version Maintenance
# This Dockerfile uses Node.js 26.13-alpine, which is the latest LTS version at the time of writing.
# To ensure security and compatibility, regularly update the NODE_VERSION ARG to the latest LTS version.
# ARG NODE_VERSION=26.13-alpine

FROM node:26.13-alpine AS dependencies

RUN npm config set allow-scripts=pnpm --location=user

RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile;

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM node:26.13-alpine AS builder

RUN npm config set allow-scripts=pnpm --location=user

RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

ENV NODE_ENV=production

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
# If you want to speed up Docker rebuilds, you can cache the build artifacts
# by adding: --mount=type=cache,target=/app/.next/cache
# This caches the .next/cache directory across builds, but it also prevents
# .next/cache/fetch-cache from being included in the final image, meaning
# cached fetch responses from the build won't be available at runtime.
RUN pnpm build

# ============================================
# Stage 4: Get cron dependencies
# ============================================

FROM node:26.13-alpine AS cron

RUN npm config set allow-scripts=pnpm --location=user

RUN npm install -g pnpm

WORKDIR /app/cron

COPY ./cron .

RUN pnpm install --frozen-lockfile;

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM node:26.13-alpine AS runner

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the run time.
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=node:node /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown node:node .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

RUN mkdir cron
RUN chown node:node cron

COPY --from=cron --chown=node:node /app/cron ./cron

# If you want to persist the fetch cache generated during the build so that
# cached responses are available immediately on startup, uncomment this line:
# COPY --from=builder --chown=node:node /app/.next/cache ./.next/cache

# Switch to non-root user for security best practices
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --spider http://$HOSTNAME:80/ || exit 1

# Expose port 80 to allow HTTP traffic
EXPOSE 80

COPY ./server-init.js ./

# Start Next.js standalone server
CMD ["node", "server-init.js"]