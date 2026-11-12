# ============================================
# Stage 1: Docker
# ============================================

FROM docker:29 AS docker

# ============================================
# Stage 2: Node deps
# ============================================

# IMPORTANT: Node.js Version Maintenance
# This Dockerfile uses Node.js 26.13-alpine, which is the latest LTS version at the time of writing.
# To ensure security and compatibility, regularly update the NODE_VERSION ARG to the latest LTS version.
# ARG NODE_VERSION=26.13-alpine

FROM node:26.13-alpine AS dependencies

RUN npm config set allow-scripts=pnpm --location=user

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./ 

RUN pnpm install --frozen-lockfile;

# ============================================
# Stage 3: Node runner
# ============================================

FROM node:26.13-alpine AS runner

COPY --from=docker /usr/local/bin/docker /usr/local/bin/docker

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

# Set production environment variables
ENV NODE_ENV=production

# Switch to non-root user for security best practices
# USER node

# Healthcheck
HEALTHCHECK --interval=240s --timeout=120s --start-period=1s --retries=3 \
  CMD npm health || exit 1

# Start Next.js standalone server
CMD ["npm", "start"]