import { NextResponse } from "next/server";
import { generateObituaryPdfBytes } from "@/lib/pdf-generation";

export async function GET(
  request: Request,
  { params }: { params: { reference: string } }
) {
  try {
    const { reference } = params;

    if (!reference) {
      return NextResponse.json(
        { error: "Obituary reference is required" },
        { status: 400 }
      );
    }

    const pdfBytes = await generateObituaryPdfBytes(reference);

    if (!pdfBytes) {
      return NextResponse.json(
        { error: "Obituary not found or failed to generate PDF" },
        { status: 404 } // Or 500 if it implies a server error during generation
      );
    }

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reference}_Obituary_Report.pdf"`
      }
    });
  } catch (error) {
    console.error("Error in GET /api/generate-pdf/[reference]:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: "Failed to process PDF request", details: errorMessage },
      { status: 500 }
    );
  }
}
