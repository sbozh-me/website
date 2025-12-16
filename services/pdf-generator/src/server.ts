import Fastify from "fastify";
import puppeteer from "puppeteer";

const fastify = Fastify({
  logger: true,
});

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
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Set light theme for PDF
    await page.evaluate(() => {
      const doc = document.querySelector(".pmdxjs-document");
      if (doc) {
        doc.setAttribute("data-theme", "light");
      }
    });

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
