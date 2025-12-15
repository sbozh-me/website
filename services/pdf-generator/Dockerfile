# syntax=docker/dockerfile:1

FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium path for Puppeteer
ENV CHROME_PATH=/usr/bin/chromium

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod || pnpm install --prod

# Copy source and build
COPY tsconfig.json ./
COPY src ./src

RUN pnpm add -D typescript tsx @types/node && pnpm build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 pdfgen \
    && chown -R pdfgen:nodejs /app

USER pdfgen

EXPOSE 3010

ENV PORT=3010
ENV HOST=0.0.0.0

CMD ["node", "dist/server.js"]
