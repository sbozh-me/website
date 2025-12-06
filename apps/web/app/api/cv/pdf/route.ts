import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

// Common Chrome paths on different platforms
const CHROME_PATHS = {
  darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  linux: "/usr/bin/google-chrome",
  win32: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
};

function getChromePath(): string {
  const platform = process.platform as keyof typeof CHROME_PATHS;
  return process.env.CHROME_PATH || CHROME_PATHS[platform] || CHROME_PATHS.linux;
}

export async function GET(request: NextRequest) {
  try {
    // Get the base URL from the request
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Launch Puppeteer with system Chrome
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: getChromePath(),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Navigate to the CV page
    await page.goto(`${baseUrl}/cv`, {
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

    // Generate PDF using print emulation
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Sem_Bozhyk_CV.pdf"',
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
