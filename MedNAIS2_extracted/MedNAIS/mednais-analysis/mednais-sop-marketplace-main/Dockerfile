# ===============================================
# MedNAIS SOP Marketplace - Production Dockerfile
# ===============================================
# Multi-stage build for optimized production image

# -----------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------
FROM node:20-alpine AS deps

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  else echo "Warning: Lockfile not found. It is recommended to commit lockfiles to version control." && yarn install; \
  fi

# -----------------------------------------------
# Stage 2: Builder
# -----------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Copy Prisma schema and generate client
RUN npx prisma generate

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
# This will create a standalone build
RUN yarn build

# -----------------------------------------------
# Stage 3: Python Backend Builder
# -----------------------------------------------
FROM python:3.11-slim AS python-builder

WORKDIR /app/backend

# Install system dependencies for Python packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# -----------------------------------------------
# Stage 4: Production Runner
# -----------------------------------------------
FROM node:20-alpine AS runner

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    libc6-compat \
    openssl \
    curl

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy built Next.js application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma files and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy Python backend
COPY --from=python-builder --chown=nextjs:nodejs /root/.local /home/nextjs/.local
COPY --chown=nextjs:nodejs backend ./backend

# Set Python path for local user packages
ENV PATH="/home/nextjs/.local/bin:${PATH}"

# Switch to non-root user
USER nextjs

# Expose ports
# 3000 for Next.js
# 8001 for FastAPI backend
EXPOSE 3000 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
