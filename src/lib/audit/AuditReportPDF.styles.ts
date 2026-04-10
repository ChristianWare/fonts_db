// lib/audit/AuditReportPDF.styles.ts
import { StyleSheet } from "@react-pdf/renderer";

const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const BLACK = "#0f0f0f";
const WHITE = "#ffffff";
const ACCENT = "#ffbe00";
const GRAY = "#666666";
const LIGHT_GRAY = "#f5f5f5";
const BORDER = "#e8e8e8";
const GREEN = "#0e8e0e";
const RED = "#ff0026";
const ORANGE = "#d97706";

export const auditPdfStyles = StyleSheet.create({
  // ── Page ──
  page: {
    fontFamily: FONT,
    fontSize: 10,
    padding: 0,
    backgroundColor: WHITE,
  },

  // ── Header band ──
  header: {
    backgroundColor: BLACK,
    padding: "32px 40px 28px 40px",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "column",
    gap: 6,
  },
  headerLabel: {
    fontSize: 9,
    fontFamily: FONT,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONT_BOLD,
    color: WHITE,
    letterSpacing: -0.5,
  },
  headerUrl: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  gradeBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 40,
    fontFamily: FONT_BOLD,
    letterSpacing: -1,
    lineHeight: 1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    justifyContent: "flex-end",
  },
  scoreNum: {
    fontSize: 32,
    fontFamily: FONT_BOLD,
    color: WHITE,
    letterSpacing: -1,
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    marginLeft: 2,
  },

  // ── Summary bar ──
  summaryBar: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
  },
  summaryText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.5,
  },

  // ── Stats row ──
  statsRow: {
    flexDirection: "row",
    backgroundColor: BLACK,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  statCell: {
    flex: 1,
    padding: "16px 20px",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  statCellLast: {
    flex: 1,
    padding: "16px 20px",
  },
  statVal: {
    fontSize: 22,
    fontFamily: FONT_BOLD,
    color: WHITE,
    letterSpacing: -0.8,
    lineHeight: 1,
    marginBottom: 3,
  },
  statValRed: {
    fontSize: 22,
    fontFamily: FONT_BOLD,
    color: RED,
    letterSpacing: -0.8,
    lineHeight: 1,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // ── Body ──
  body: {
    padding: "24px 40px 40px 40px",
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 4,
  },

  // ── Category block ──
  categoryBlock: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gradeBadgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 10,
    fontFamily: FONT_BOLD,
    color: WHITE,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: FONT_BOLD,
    color: BLACK,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  categoryScore: {
    fontSize: 10,
    color: GRAY,
    fontFamily: FONT_BOLD,
  },

  // ── Check row ──
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  checkRowLast: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  checkIcon: {
    fontSize: 10,
    fontFamily: FONT_BOLD,
    width: 16,
    marginRight: 8,
    marginTop: 1,
  },
  checkIconPass: {
    color: GREEN,
  },
  checkIconFail: {
    color: RED,
  },
  checkContent: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
    color: BLACK,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  checkMessage: {
    fontSize: 9,
    color: GRAY,
    lineHeight: 1.5,
  },
  checkFix: {
    fontSize: 9,
    color: "#7a5c00",
    backgroundColor: "#fff8e1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 5,
    lineHeight: 1.5,
    borderLeftWidth: 2,
    borderLeftColor: ACCENT,
  },
  impactBadge: {
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 8,
    marginTop: 1,
    alignSelf: "flex-start",
  },
  impactHigh: {
    backgroundColor: "rgba(255,0,38,0.1)",
    color: RED,
  },
  impactMedium: {
    backgroundColor: "rgba(215,119,6,0.1)",
    color: ORANGE,
  },
  impactLow: {
    backgroundColor: "rgba(14,142,14,0.1)",
    color: GREEN,
  },

  // ── CTA footer ──
  ctaSection: {
    backgroundColor: ACCENT,
    padding: "20px 40px",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ctaText: {
    fontSize: 11,
    color: BLACK,
    maxWidth: "70%",
    lineHeight: 1.5,
  },
  ctaLink: {
    fontSize: 10,
    fontFamily: FONT_BOLD,
    color: BLACK,
    textDecoration: "underline",
  },

  // ── PDF footer ──
  pdfFooter: {
    padding: "12px 40px",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pdfFooterText: {
    fontSize: 8,
    color: "rgba(0,0,0,0.3)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Grade colors
  gradeA: { backgroundColor: GREEN },
  gradeB: { backgroundColor: "#4a8e0e" },
  gradeC: { backgroundColor: BLACK, color: ACCENT },
  gradeD: { backgroundColor: ORANGE },
  gradeF: { backgroundColor: RED },
});
