import { NextRequest, NextResponse } from "next/server";

import { resolveCVVariant } from "@/lib/cv/variants";

const PDF_SERVICE_URL =
  process.env.PDF_SERVICE_URL || "http://localhost:3010";

export async function GET(request: NextRequest) {
  const variant = resolveCVVariant(
    request.nextUrl.searchParams.get("role") ?? undefined,
    request.nextUrl.searchParams.get("lang") ?? undefined,
  );

  try {
    // Get the base URL from the request
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    const path = `/cv?role=${variant.role}&lang=${variant.lang}`;

    // Call the PDF generator service
    const response = await fetch(`${PDF_SERVICE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: `${baseUrl}${path}`,
        filename: variant.pdfFilename,
        // The service applies this theme to the document before printing;
        // name it explicitly so the PDF never depends on the service default.
        theme: "normal",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("PDF service error:", error);
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${variant.pdfFilename}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
