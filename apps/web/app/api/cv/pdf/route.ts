import { NextRequest, NextResponse } from "next/server";

const PDF_SERVICE_URL =
  process.env.PDF_SERVICE_URL || "http://localhost:3010";

const VARIANTS = {
  sem: { path: "/forum/sem-bozhyk/cv", filename: "CV_Sem_Bozhyk_Software_Developer.pdf" },
  semen: {
    path: "/forum/semen-bozhyk/cv",
    filename: "CV_Semen_Bozhyk_Builder_and_Creator.pdf",
  },
} as const;

export async function GET(request: NextRequest) {
  const variant =
    VARIANTS[request.nextUrl.searchParams.get("v") === "semen" ? "semen" : "sem"];

  try {
    // Get the base URL from the request
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Call the PDF generator service
    const response = await fetch(`${PDF_SERVICE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: `${baseUrl}${variant.path}`,
        filename: variant.filename,
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
        "Content-Disposition": `attachment; filename="${variant.filename}"`,
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
