# @sbozh/pdf-generator

Puppeteer-based PDF generation microservice for CV export.

**Version**: 1.0.0 | **Port**: 3010 | **License**: MIT

## Overview

Standalone HTTP service that converts web pages to PDF using headless Chrome. Used by the main website to generate downloadable CV/resume PDFs.

## API

### POST /generate

Generate a PDF from a URL.

**Request Body:**
```json
{
  "url": "https://sbozh.me/cv",
  "filename": "CV_Sem_Bozhyk.pdf"
}
```

**Response:** PDF file (application/pdf)

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server with hot reload
pnpm dev

# Build TypeScript
pnpm build

# Start production server
pnpm start
```

The service runs on port 3010 by default.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3010` |
| `HOST` | HTTP server host | `0.0.0.0` |

## Docker

Build and run the Docker image:

```bash
docker build -t sbozh/pdf-generator .
docker run -p 3010:3010 sbozh/pdf-generator
```

## Integration

The web app calls this service via the `/api/cv/pdf` route:

```typescript
const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || "http://localhost:3010";

const response = await fetch(`${PDF_SERVICE_URL}/generate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${baseUrl}/cv`,
    filename: "CV_Sem_Bozhyk_Software_Developer.pdf",
  }),
});
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Fastify
- **Browser**: Puppeteer (Chromium)
- **Language**: TypeScript

## PDF Options

The service generates A4-sized PDFs with:
- Zero margins (content controls margins)
- Background graphics enabled
- Light theme forced for print

## Production

In production, this service runs as a Docker container alongside the main website. See `deploy/production/docker-compose.prod.yaml` for the full setup.
