import { NextRequest, NextResponse } from "next/server";

const PDF_SERVICE_URL =
  process.env.PDF_SERVICE_URL || "http://localhost:3010";

const VARIANTS = {
  official: {
    query: "",
    theme: "declaration",
    filename: "Prohlaseni_souhlas_misto_podnikani.pdf",
  },
  branded: {
    query: "?v=branded",
    theme: "declaration-branded",
    filename: "Prohlaseni_souhlas_misto_podnikani_sbozh.pdf",
  },
} as const;

export async function GET(request: NextRequest) {
  const variant =
    VARIANTS[
      request.nextUrl.searchParams.get("v") === "branded"
        ? "branded"
        : "official"
    ];

  try {
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${PDF_SERVICE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: `${baseUrl}/sidlo${variant.query}`,
        filename: variant.filename,
        // Keep the document's own palette in the PDF (don't force CV parchment)
        theme: variant.theme,
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
