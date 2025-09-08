# Multi-stage Dockerfile for MarketSage Frontend
# Supports both development and production builds with MCP server support

FROM node:20-alpine AS base

# Stage 1: Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ postgresql-client curl wget
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with robust networking and build tools
# Using npm install instead of npm ci due to Git LFS issues with package-lock.json on Railway
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set maxsockets 1 && \
    (npm install --progress=false || \
     (echo "Retry 1 after 10s..." && sleep 10 && npm install --progress=false) || \
     (echo "Retry 2 after 20s..." && sleep 20 && npm install --progress=false) || \
     (echo "Final attempt with clean cache..." && npm cache clean --force && npm install --progress=false)) && \
    npm cache clean --force

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure required directories exist
RUN mkdir -p ./public ./src/scripts ./scripts

# Set build-time environment variables
ARG NODE_ENV=production
ARG DATABASE_URL
ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_USE_API_ONLY=true
ENV SKIP_ENV_VALIDATION=true
ENV BUILDING=true
ENV SKIP_DATABASE_CONNECTION=true

# Generate Prisma client if schema exists
RUN if [ -f "prisma/schema.prisma" ]; then \
        echo "Generating Prisma client..." && \
        npx prisma generate; \
    fi

# Rebuild native binaries for Alpine Linux
RUN apk add --no-cache --virtual .rebuild-deps python3 make g++ && \
    (npm rebuild bcrypt --build-from-source 2>/dev/null || echo "bcrypt rebuild skipped") && \
    (npm rebuild onnxruntime-node --build-from-source 2>/dev/null || echo "ONNX runtime rebuild failed - using fallback AI features") && \
    apk del .rebuild-deps

# Build the application
RUN npm run build

# Stage 3: Production Runner
FROM base AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install runtime dependencies (including TypeScript for MCP servers)
RUN apk add --no-cache postgresql-client bash curl && \
    npm install -g tsx typescript

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_CONTAINER=true
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create directories with correct ownership
RUN mkdir -p ./public ./node_modules ./.next/cache ./prisma ./scripts ./src/scripts ./src/generated/prisma && \
    chown -R nextjs:nodejs /app

# Copy production files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy essential files and MCP server source
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/src/app ./src/app
COPY --from=builder --chown=nextjs:nodejs /app/src/components ./src/components
COPY --from=builder --chown=nextjs:nodejs /app/src/mcp ./src/mcp
COPY --from=builder --chown=nextjs:nodejs /app/src/scripts ./src/scripts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib ./src/lib
COPY --from=builder --chown=nextjs:nodejs /app/src/types ./src/types
COPY --from=builder --chown=nextjs:nodejs /app/src/hooks ./src/hooks
COPY --from=builder --chown=nextjs:nodejs /app/src/providers.tsx ./src/providers.tsx
COPY --from=builder --chown=nextjs:nodejs /app/src/context ./src/context

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports (including MCP server ports)
EXPOSE 3000 3001 3002 3003 3004 3005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Default command (can be overridden)
CMD ["node", "server.js"]

# Stage 4: Development
FROM base AS development
WORKDIR /app

# Install all dependencies including dev dependencies
COPY package.json package-lock.json* ./
# Use npm install instead of npm ci due to Git LFS issues with package-lock.json
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client if schema exists
RUN if [ -f "prisma/schema.prisma" ]; then \
        npx prisma generate; \
    fi

# Expose port for development
EXPOSE 3000 3001 3002 3003 3004 3005

# Start development server
CMD ["npm", "run", "dev"]