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
  // paddingTop: 40 on ALL pages — gives 40px top margin everywhere including page 1
  // paddingBottom: 180 protects content from the absolute-positioned CTA block
  page: {
    fontFamily: FONT,
    fontSize: 10,
    paddingTop: 50,
    paddingBottom: 180,
    backgroundColor: WHITE,
  },

  // ── Header ──
  header: {
    backgroundColor: BLACK,
    padding: "32px 40px 28px 40px",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: -50,
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

  // ── Introduction section ──
  introSection: {
    padding: "28px 40px 24px 40px",
  },
  introTitle: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  introPara: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.7,
    marginBottom: 14,
  },
  introSubhead: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: BLACK,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  introCategoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  introCategoryPill: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: WHITE,
    backgroundColor: BLACK,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
  },
  introImpactRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 6,
  },
  introImpactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  introImpactDot: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
  },
  introImpactLabel: {
    fontSize: 9,
    color: "#444444",
  },
  introNote: {
    fontSize: 9,
    color: GRAY,
    lineHeight: 1.6,
    borderLeftWidth: 2,
    borderLeftColor: ACCENT,
    paddingLeft: 10,
    marginTop: 4,
  },

  // ── Body (starts on page 2 via break prop) ──
  body: {
    padding: "24px 40px 0 40px",
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 14,
    marginTop: 4,
  },

  // ── Checklist overview ──
  checklistSection: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  checklistSectionHeader: {
    backgroundColor: BLACK,
    padding: "10px 14px",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  checklistSectionTitle: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: "8px 0",
  },
  checklistItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  // ── Checklist icons: border applied DIRECTLY to Text element ──
  // This avoids the View centering issue that caused empty boxes
  checklistIconPass: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: GREEN,
    borderWidth: 1,
    borderColor: GREEN,
    paddingHorizontal: 3,
    paddingVertical: 2,
    marginRight: 8,
    textAlign: "center",
    width: 14,
  },
  checklistIconFail: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: RED,
    borderWidth: 1,
    borderColor: RED,
    paddingHorizontal: 3,
    paddingVertical: 2,
    marginRight: 8,
    textAlign: "center",
    width: 14,
  },
  checklistItemName: {
    fontSize: 8,
    color: "#333333",
    flex: 1,
  },

  // ── Category block — first chunk ──
  categoryBlock: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  // ── Category block — continuation chunks ──
  // Has a heavier top border to signal it's a new block continuing the category
  categoryBlockContinuation: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 2,
    borderTopColor: BLACK,
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
  categoryHeaderContinued: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 14px",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  categoryHeaderContinuedLabel: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryStatusIcon: {
    fontSize: 12,
    fontFamily: FONT_BOLD,
    width: 16,
  },
  categoryStatusPass: {
    color: GREEN,
  },
  categoryStatusFail: {
    color: RED,
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
    paddingTop: 10,
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  checkRowLast: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 11,
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
    fontSize: 10,
    fontFamily: FONT_BOLD,
    color: BLACK,
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  checkWhat: {
    fontSize: 9,
    color: GRAY,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  checkWhy: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.5,
    marginBottom: 3,
    fontFamily: FONT_BOLD,
  },
  checkPositive: {
    fontSize: 9,
    color: GREEN,
    lineHeight: 1.5,
    marginTop: 3,
    fontFamily: FONT_BOLD,
  },
  checkFix: {
    fontSize: 9,
    color: "#7a5c00",
    backgroundColor: "#fff8e1",
    paddingHorizontal: 8,
    paddingVertical: 5,
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

  // ── Written summary ──
  auditSummarySection: {
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  auditSummaryHeader: {
    backgroundColor: BLACK,
    padding: "10px 14px",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  auditSummaryHeaderTitle: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  auditSummaryBody: {
    padding: "14px 18px",
  },
  auditSummarySubhead: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
    color: BLACK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 10,
  },
  auditSummarySubheadFirst: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
    color: BLACK,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 0,
  },
  auditSummaryText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.6,
  },

  // ── CTA — pinned to bottom of last page ──
  ctaAbsoluteWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  logoWrap: {
    paddingHorizontal: 40,
    paddingBottom: 16,
    paddingTop: 16,
    backgroundColor: ACCENT,
  },
  logoImage: {
    width: 80,
    height: 26,
    objectFit: "contain",
  },
  ctaSection: {
    backgroundColor: ACCENT,
    padding: "20px 40px",
    flexDirection: "column",
  },
  ctaText: {
    fontSize: 11,
    color: BLACK,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  ctaLink: {
    fontSize: 12,
    fontFamily: FONT_BOLD,
    color: BLACK,
    textDecoration: "underline",
  },
  pdfFooter: {
    padding: "10px 40px",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: WHITE,
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
