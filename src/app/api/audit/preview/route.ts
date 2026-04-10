import { NextRequest, NextResponse } from "next/server";
import { generateAuditPDF } from "@/lib/audit/generateAuditPDF";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const pdfBuffer = await generateAuditPDF(data);
    const domain = (() => {
      try {
        return new URL(data.url).hostname.replace(/\./g, "-");
      } catch {
        return "audit";
      }
    })();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="audit-${domain}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[audit preview error]", err);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 },
    );
  }
}
