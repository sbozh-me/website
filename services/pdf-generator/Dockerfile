# syntax=docker/dockerfile:1

FROM node:20-slim

WORKDIR /app

# Install Chrome dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json ./

# Install dependencies (puppeteer will download Chrome)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
RUN npm install --include=dev

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN ./node_modules/.bin/tsc

EXPOSE 3010

ENV PORT=3010
ENV HOST=0.0.0.0

CMD ["node", "dist/server.js"]
