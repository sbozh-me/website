import Fastify from "fastify";
import puppeteer from "puppeteer-core";
import { existsSync } from "fs";

const fastify = Fastify({
  logger: true,
});

// Chrome paths by platform
const CHROME_PATHS: Record<string, string[]> = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: ["/usr/bin/chromium", "/usr/bin/google-chrome", "/usr/bin/chromium-browser"],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
};

function getChromePath(): string {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }

  const paths = CHROME_PATHS[process.platform] || CHROME_PATHS.linux;
  for (const path of paths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Fallback to first path (will error if not found)
  return paths[0];
}

interface GeneratePdfBody {
  url: string;
  filename?: string;
}

fastify.post<{ Body: GeneratePdfBody }>("/generate", async (request, reply) => {
  const { url, filename = "document.pdf" } = request.body;

  if (!url) {
    return reply.status(400).send({ error: "URL is required" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: getChromePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--no-zygote",
        "--disable-breakpad",
      ],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Set light theme for PDF (call the same toggle mechanism)
    await page.evaluate(() => {
      const doc = document.querySelector(".pmdxjs-document");
      if (doc) {
        doc.setAttribute("data-theme", "light");
      }
    });

    // Wait for theme change to apply
    await new Promise((resolve) => setTimeout(resolve, 100));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .send(Buffer.from(pdf));
  } catch (error) {
    fastify.log.error(error, "PDF generation failed");
    return reply.status(500).send({ error: "Failed to generate PDF" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

fastify.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3010", 10);
    const host = process.env.HOST || "0.0.0.0";

    await fastify.listen({ port, host });
    fastify.log.info(`PDF Generator service listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
