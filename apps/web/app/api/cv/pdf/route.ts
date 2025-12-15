import { NextRequest, NextResponse } from "next/server";

const PDF_SERVICE_URL =
  process.env.PDF_SERVICE_URL || "http://localhost:3010";

export async function GET(request: NextRequest) {
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
        url: `${baseUrl}/cv`,
        filename: "Sem_Bozhyk_CV.pdf",
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
        "Content-Disposition": 'attachment; filename="Sem_Bozhyk_CV.pdf"',
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
