// lib/audit/generateAuditPDF.tsx
import { renderToBuffer } from "@react-pdf/renderer";
import AuditReportPDF from "./AuditReportPDF";

interface Check {
  id: string;
  label: string;
  passed: boolean;
  message: string;
  fix?: string;
  impact: "high" | "medium" | "low";
}

interface Category {
  id: string;
  label: string;
  grade: string;
  score: number;
  checks: Check[];
}

interface AuditPDFData {
  url: string;
  score: number;
  grade: string;
  summary: string;
  monthlyVisitors: number;
  keywordsRanking: number;
  estimatedLostBookings: number;
  categories: Category[];
  firstName?: string;
}

export async function generateAuditPDF(data: AuditPDFData): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(<AuditReportPDF {...data} />);
  return pdfBuffer as Buffer;
}
