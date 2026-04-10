// lib/audit/AuditReportPDF.tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { auditPdfStyles as s } from "./AuditReportPDF.styles";

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

interface AuditReportPDFProps {
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

function gradeStyle(grade: string) {
  switch (grade) {
    case "A":
      return s.gradeA;
    case "B":
      return s.gradeB;
    case "C":
      return s.gradeC;
    case "D":
      return s.gradeD;
    default:
      return s.gradeF;
  }
}

function impactStyle(impact: string) {
  if (impact === "high") return s.impactHigh;
  if (impact === "medium") return s.impactMedium;
  return s.impactLow;
}

export default function AuditReportPDF({
  url,
  score,
  grade,
  summary,
  monthlyVisitors,
  keywordsRanking,
  estimatedLostBookings,
  categories,
}: AuditReportPDFProps) {
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  return (
    <Document>
      <Page size='A4' style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerLabel}>
              Free Website Audit — Fonts & Footers
            </Text>
            <Text style={s.headerTitle}>Your full audit report.</Text>
            <Text style={s.headerUrl}>{domain}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={[s.gradeBadgeLarge, gradeStyle(grade)]}>{grade}</Text>
            <View style={s.scoreRow}>
              <Text style={s.scoreNum}>{score}</Text>
              <Text style={s.scoreMax}>/100</Text>
            </View>
          </View>
        </View>

        {/* ── Summary ── */}
        <View style={s.summaryBar}>
          <Text style={s.summaryText}>{summary}</Text>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.statCell}>
            <Text style={s.statVal}>~{monthlyVisitors}</Text>
            <Text style={s.statLabel}>Monthly organic visitors</Text>
          </View>
          <View style={s.statCell}>
            <Text style={s.statVal}>{keywordsRanking}</Text>
            <Text style={s.statLabel}>Keywords ranking</Text>
          </View>
          <View style={s.statCellLast}>
            <Text style={s.statValRed}>~{estimatedLostBookings}</Text>
            <Text style={s.statLabel}>Est. bookings lost/month</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={s.body}>
          <Text style={s.sectionTitle}>Full Breakdown</Text>

          {categories.map((cat) => (
            <View key={cat.id} style={s.categoryBlock} wrap={false}>
              {/* Category header */}
              <View style={s.categoryHeader}>
                <View style={s.categoryHeaderLeft}>
                  <Text style={[s.gradeBadgeSmall, gradeStyle(cat.grade)]}>
                    {cat.grade}
                  </Text>
                  <Text style={s.categoryLabel}>{cat.label}</Text>
                </View>
                <Text style={s.categoryScore}>{cat.score}/100</Text>
              </View>

              {/* Checks */}
              {cat.checks.map((chk, idx) => {
                const isLast = idx === cat.checks.length - 1;
                return (
                  <View
                    key={chk.id}
                    style={isLast ? s.checkRowLast : s.checkRow}
                  >
                    {/* ✓ or ✗ */}
                    <Text
                      style={[
                        s.checkIcon,
                        chk.passed ? s.checkIconPass : s.checkIconFail,
                      ]}
                    >
                      {chk.passed ? "✓" : "✗"}
                    </Text>

                    <View style={s.checkContent}>
                      <Text style={s.checkLabel}>{chk.label}</Text>
                      <Text style={s.checkMessage}>{chk.message}</Text>
                      {/* Fix recommendation — only on failing checks */}
                      {!chk.passed && chk.fix && (
                        <Text style={s.checkFix}>→ Fix: {chk.fix}</Text>
                      )}
                    </View>

                    {/* Impact badge */}
                    <Text style={[s.impactBadge, impactStyle(chk.impact)]}>
                      {chk.impact}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── CTA ── */}
        <View style={s.ctaSection}>
          <Text style={s.ctaText}>
            Want us to walk you through these results? Book a free 15-minute
            call and we&apos;ll show you the 2–3 things costing you the most
            rides.
          </Text>
          <Text style={s.ctaLink}>
            calendly.com/chris-fontsandfooters/30min
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={s.pdfFooter}>
          <Text style={s.pdfFooterText}>
            Audit generated by Fonts & Footers — fontsandfooters.com/audit
          </Text>
          <Text style={s.pdfFooterText}>{domain}</Text>
        </View>
      </Page>
    </Document>
  );
}
