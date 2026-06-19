/* eslint-disable jsx-a11y/alt-text */
// lib/audit/AuditReportPDF.tsx
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Svg,
  Path,
  Rect,
  StyleSheet,
} from "@react-pdf/renderer";
import { s, C } from "./AuditReportPDF.styles";
import { registerAuditFonts } from "./fonts";

registerAuditFonts();

// ── Types ──
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
interface DesignSwatch {
  hex: string;
  role: string; // e.g. "Primary surface", "Accent", "Text"
}
interface DesignRead {
  screenshot?: string; // hosted URL or data URL of the homepage screenshot
  palette: DesignSwatch[]; // 4–6 swatches, most prominent first
  headingFont: string;
  bodyFont: string;
  fontNote: string; // one-line read on the typography
  readToday: string; // "On the site today" paragraph
  premiumDirection: string; // "A premium direction" paragraph
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
  /** Optional: only set when you have a date string; defaults to today */
  reportDate?: string;
  /** Optional: the auto design read (screenshot → Claude vision). Page renders only when present. */
  design?: DesignRead;
}

// ── Check copy (the "why it matters" + passing lines) ──
const CHECK_INFO: Record<
  string,
  { name: string; why: string; positive: string }
> = {
  speed: {
    name: "Page Speed Score",
    why: "Most limo bookings happen on a phone. A slow site loses the visitor within about three seconds — before they ever reach your booking form.",
    positive:
      "Your site loads fast on mobile — visitors stay longer and are more likely to complete a booking.",
  },
  fcp: {
    name: "First Contentful Paint",
    why: "If nothing appears in the first second or two, visitors assume the site is broken and hit the back button.",
    positive:
      "Your content appears quickly on load, which reduces bounce rate.",
  },
  lcp: {
    name: "Largest Contentful Paint",
    why: "This is Google's top performance metric and it directly affects where you rank in search results.",
    positive:
      "Your main content renders in a reasonable time, which helps your rankings.",
  },
  form: {
    name: "Online Booking Form",
    why: "Operators without online booking lose every visitor who won't pick up a phone — the majority of modern customers.",
    positive:
      "Visitors can act without calling, a real conversion advantage over operators who force a phone call first.",
  },
  quote: {
    name: "Instant Quote",
    why: "People decide based on price. With no visible number, most visitors move on to a competitor who shows one.",
    positive:
      "You surface pricing or quoting on the site, giving visitors the confidence to book rather than shop around.",
  },
  direct: {
    name: "Direct Booking",
    why: "Third-party platforms take a cut of every ride — over a year that's thousands of dollars leaving the business.",
    positive:
      "Your reservations go directly to you. You're keeping 100% of every ride instead of paying platform fees.",
  },
  mobilebook: {
    name: "Mobile Booking Experience",
    why: "Over 70% of transportation searches happen on mobile. A form that breaks on phones loses most potential customers.",
    positive:
      "Your booking flow works on a phone screen, so you're capturing the majority of mobile visitors.",
  },
  title: {
    name: "Page Title",
    why: "Without a title tag, Google has no idea what your page is about and won't rank it for anything.",
    positive:
      "Your page has a title tag — the foundational SEO signal Google needs to understand and rank you.",
  },
  meta: {
    name: "Meta Description",
    why: "A specific, compelling description increases how many people click your listing over a competitor's.",
    positive:
      "Present — this helps your Google listing stand out and earns more click-throughs.",
  },
  h1: {
    name: "H1 Heading",
    why: "Google uses the H1 to understand the page. It's one of the most basic, important on-page signals.",
    positive:
      "Your page has a clear H1 that tells both visitors and Google what it's about.",
  },
  traffic: {
    name: "Organic Keyword Traffic",
    why: "Organic traffic is free, compounds over time, and is the most valuable long-term source of bookings.",
    positive:
      "Your site is getting meaningful organic traffic — people are finding you without paid ads.",
  },
  geo: {
    name: "Location Keywords",
    why: "Searches like \u201cblack car service [your city]\u201d are your highest-converting traffic. Without the location, you can't rank for them.",
    positive:
      "Your homepage includes location keywords, which helps you appear in local searches.",
  },
  sitemap: {
    name: "XML Sitemap",
    why: "Without a sitemap, Google can miss pages entirely — meaning they never appear in search.",
    positive:
      "Present — Google can find and index all of your pages efficiently.",
  },
  robots: {
    name: "Robots.txt File",
    why: "A misconfigured robots.txt can accidentally block Google from crawling your whole site.",
    positive:
      "Present and correctly configured — crawlers can navigate your site.",
  },
  ssl: {
    name: "SSL Certificate (HTTPS)",
    why: "Google penalizes sites without SSL, and a \u201cNot Secure\u201d warning makes visitors leave immediately.",
    positive:
      "Secured with HTTPS — visitors see the padlock, which builds immediate trust.",
  },
  phone: {
    name: "Phone Number Visible",
    why: "Corporate clients and first-time bookers often want to call first. A hidden number loses them.",
    positive:
      "Your phone number is visible without scrolling — bookers can reach you instantly.",
  },
  cta: {
    name: "Call to Action (CTA)",
    why: "With no clear next step above the fold, visitors leave without acting no matter how good the service is.",
    positive:
      "You have a clear booking call-to-action — visitors know exactly what to do next.",
  },
  reviews: {
    name: "Reviews & Social Proof",
    why: "84% of people trust online reviews as much as a personal recommendation.",
    positive:
      "Testimonials are visible, which builds credibility with visitors who don't know you yet.",
  },
  fleet: {
    name: "Fleet / Vehicle Showcase",
    why: "Clients want to see what they're booking. A fleet section builds confidence and lifts conversion.",
    positive:
      "You showcase your vehicles, so clients can see what they're booking before they commit.",
  },
  platform: {
    name: "Site Platform",
    why: "Some platforms limit your ability to customize booking flows, page speed, and SEO.",
    positive:
      "Built on a capable platform — you have the flexibility to optimize the booking experience and SEO.",
  },
  bookingplatform: {
    name: "Third-Party Booking Platform",
    why: "Third-party processors charge a fee on every booking — thousands a year that could stay in your business.",
    positive:
      "None detected — you appear to take direct bookings and keep 100% of your revenue.",
  },
  analytics: {
    name: "Web Analytics",
    why: "Without analytics you can't see which channels work, where visitors drop off, or how many leave without booking.",
    positive:
      "Analytics is installed — you can see where visitors come from and how they behave.",
  },
  schema: {
    name: "Schema Markup",
    why: "Schema improves how you appear in local search and can enable rich results like star ratings.",
    positive:
      "Present — Google can better understand your business type and location for local search.",
  },
  sociallinks: {
    name: "Social Media Links",
    why: "Social links give clients another way to verify you're legitimate before they book.",
    positive:
      "You link to active social profiles — another trust signal for visitors.",
  },
  favicon: {
    name: "Favicon",
    why: "A missing favicon signals an unfinished site and erodes trust before a word is read.",
    positive:
      "Present — a small detail that signals a polished, maintained site.",
  },
  copyright: {
    name: "Copyright Year",
    why: "An outdated year tells visitors and search engines the site isn't actively maintained.",
    positive:
      "Current — signals to visitors and Google that your site is actively maintained.",
  },
  viewport: {
    name: "Mobile Viewport",
    why: "Without this tag, your site renders as a shrunken desktop version — tiny text, untappable buttons.",
    positive: "Configured to display correctly across phones and tablets.",
  },
  heroimages: {
    name: "Real Homepage Imagery",
    why: "Premium clients make emotional decisions before they book. No real photography signals no real brand.",
    positive:
      "Your homepage uses real imagery, which makes a strong first impression.",
  },
  stockphotos: {
    name: "Original Photography",
    why: "Clients booking premium black car want to see your actual vehicles, not anonymous stock sedans.",
    positive:
      "No stock-photo services detected — your imagery reads as authentic and specific.",
  },
  defaulttheme: {
    name: "Custom Design",
    why: "Default themes make you look identical to thousands of small businesses. Premium service needs a premium look.",
    positive:
      "Your site appears custom or heavily customized, which helps you stand apart from template sites.",
  },
  fontoverload: {
    name: "Typography Discipline",
    why: "Loading many font families slows the page and feels DIY to discerning corporate clients.",
    positive:
      "A focused, disciplined font count reads professional and cohesive across the site.",
  },
  inlinestyles: {
    name: "Design System Quality",
    why: "Excessive inline styles signal a site assembled without design discipline.",
    positive:
      "Clean code structure with no excessive inline styling — a purposeful, well-built foundation.",
  },
};

// ── Helpers ──
function gradeStyle(g: string) {
  return g === "A"
    ? s.gradeA
    : g === "B"
      ? s.gradeB
      : g === "C"
        ? s.gradeC
        : g === "D"
          ? s.gradeD
          : s.gradeF;
}
function impactStyle(i: string) {
  return i === "high"
    ? s.impactHigh
    : i === "medium"
      ? s.impactMedium
      : s.impactLow;
}
function info(chk: Check) {
  return (
    CHECK_INFO[chk.id] ?? {
      name: chk.label,
      why: chk.message,
      positive: chk.message,
    }
  );
}

// ── check / cross marks ──
function Mark({ passed }: { passed: boolean }) {
  return (
    <Svg width={15} height={15} viewBox='0 0 15 15'>
      <Rect
        x={0}
        y={0}
        width={15}
        height={15}
        rx={2}
        fill={passed ? C.green : C.red}
      />
      {passed ? (
        <Path
          d='M3.5 7.8 L6.2 10.5 L11.5 4.5'
          stroke='#fff'
          strokeWidth={1.8}
          fill='none'
        />
      ) : (
        <Path
          d='M4 4 L11 11 M11 4 L4 11'
          stroke='#fff'
          strokeWidth={1.8}
          fill='none'
        />
      )}
    </Svg>
  );
}

function CornerDots({ color }: { color: string }) {
  return (
    <>
      <View style={[s.dot, s.dotTL, { backgroundColor: color }]} />
      <View style={[s.dot, s.dotTR, { backgroundColor: color }]} />
      <View style={[s.dot, s.dotBL, { backgroundColor: color }]} />
      <View style={[s.dot, s.dotBR, { backgroundColor: color }]} />
    </>
  );
}

function RunningFooter({ domain }: { domain: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{domain}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={s.footerText}>Fonts &amp; Footers — Website Audit</Text>
      </View>
    </View>
  );
}

// ── Subtitle per category (data-driven) ──
function catSubtitle(cat: Category, lowestId: string): string {
  if (cat.score === 100)
    return "Clean sweep — every check in this category is passing. You're ahead here.";
  if (cat.id === lowestId)
    return "Your single biggest opportunity. This is where bookings are quietly bleeding out.";
  if (cat.score < 60)
    return "Some high-impact gaps here are actively costing you bookings.";
  return "The fundamentals are in place, with a few gaps worth closing.";
}

// ════════════════════════════════════════════════════════════
// ── Design-read page (auto "does it look premium?") ──
const dr = StyleSheet.create({
  shot: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    objectPosition: "top",
  },
  shotFrame: { borderWidth: 1, borderColor: C.cardBorder, marginBottom: 22 },
  sectionLabel: {
    fontFamily: "Mono",
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: C.textMuted,
    marginBottom: 10,
  },
  swatchRow: { flexDirection: "row", gap: 8, marginBottom: 26 },
  swatch: { flex: 1 },
  chip: {
    height: 48,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 6,
  },
  hex: {
    fontFamily: "Mono",
    fontSize: 8.5,
    color: C.textBody,
    letterSpacing: 0.3,
  },
  role: {
    fontFamily: "Body",
    fontSize: 8,
    color: C.textMuted,
    marginTop: 2,
    lineHeight: 1.3,
  },
  typeRow: { flexDirection: "row", gap: 48, marginBottom: 10 },
  typeKey: {
    fontFamily: "Mono",
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.textMuted,
    marginBottom: 3,
  },
  typeVal: {
    fontFamily: "Display",
    fontSize: 22,
    color: C.black,
    textTransform: "uppercase",
  },
  fontNote: {
    fontFamily: "Body",
    fontSize: 9.5,
    lineHeight: 1.5,
    color: C.textMuted,
    marginBottom: 26,
    maxWidth: 470,
  },
  readGrid: { flexDirection: "row", gap: 14 },
  readBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    backgroundColor: C.white,
  },
  readBlockAmber: { backgroundColor: C.accent, borderColor: C.goldLine },
  readHead: {
    fontFamily: "Mono",
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.black,
    marginBottom: 8,
  },
  readText: {
    fontFamily: "Body",
    fontSize: 9.5,
    lineHeight: 1.5,
    color: C.textBody,
  },
});

function DesignReadPage({
  design,
  domain,
}: {
  design: DesignRead;
  domain: string;
}) {
  return (
    <Page size='A4' style={s.pageLight}>
      <CornerDots color={C.black} />
      <Text style={s.catKicker}>Brand &amp; Design — A Closer Look</Text>
      <Text style={s.scTitle}>Does It Look Premium?</Text>
      <View style={{ height: 16 }} />

      {design.screenshot ? (
        <View style={dr.shotFrame}>
          <Image src={design.screenshot} style={dr.shot} />
        </View>
      ) : null}

      <Text style={dr.sectionLabel}>The Palette On Your Site</Text>
      <View style={dr.swatchRow}>
        {design.palette.slice(0, 6).map((sw, i) => (
          <View key={i} style={dr.swatch}>
            <View style={[dr.chip, { backgroundColor: sw.hex }]} />
            <Text style={dr.hex}>{sw.hex.toUpperCase()}</Text>
            <Text style={dr.role}>{sw.role}</Text>
          </View>
        ))}
      </View>

      <Text style={dr.sectionLabel}>The Type</Text>
      <View style={dr.typeRow}>
        <View>
          <Text style={dr.typeKey}>Headings</Text>
          <Text style={dr.typeVal}>{design.headingFont}</Text>
        </View>
        <View>
          <Text style={dr.typeKey}>Body</Text>
          <Text style={dr.typeVal}>{design.bodyFont}</Text>
        </View>
      </View>
      <Text style={dr.fontNote}>{design.fontNote}</Text>

      <View style={dr.readGrid}>
        <View style={dr.readBlock}>
          <Text style={dr.readHead}>On The Site Today</Text>
          <Text style={dr.readText}>{design.readToday}</Text>
        </View>
        <View style={[dr.readBlock, dr.readBlockAmber]}>
          <Text style={dr.readHead}>A Premium Direction</Text>
          <Text style={dr.readText}>{design.premiumDirection}</Text>
        </View>
      </View>

      <RunningFooter domain={domain} />
    </Page>
  );
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
  firstName,
  reportDate,
  design,
}: AuditReportPDFProps) {
  const domain = (() => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  })();
  const name =
    firstName && firstName !== "there" ? firstName.toUpperCase() : null;
  const date =
    reportDate ??
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const lowestId =
    [...categories].sort((a, b) => a.score - b.score)[0]?.id ?? "";
  const allChecks = categories.flatMap((c) => c.checks);
  const failingHigh = allChecks.filter((c) => !c.passed && c.impact === "high");
  const weak = [...categories]
    .filter((c) => c.score < 100)
    .sort((a, b) => a.score - b.score);
  const strongLabels = categories
    .filter((c) => c.score === 100)
    .map((c) => c.label.toLowerCase());

  return (
    <Document>
      {/* ════════ COVER ════════ */}
      <Page size='A4' style={s.pageDark}>
        <View style={s.coverPad}>
          <CornerDots color={C.white} />
          <View style={s.coverTopRow}>
            <View style={s.brandRow}>
              <Text style={s.brandName}>FONTS &amp; FOOTERS</Text>
            </View>
            <View style={s.eyebrowRow}>
              <View style={s.eyebrowBar} />
              <Text style={s.eyebrowText}>Free Website Audit</Text>
            </View>
          </View>

          <View style={s.coverHeadlineWrap}>
            <View style={s.coverHatch} />
            <Text style={s.coverH}>YOUR</Text>
            <Text style={[s.coverH, s.coverHGold]}>WEBSITE</Text>
            <Text style={s.coverH}>AUDIT.</Text>
            <Text style={s.coverDomain}>{domain}</Text>
          </View>

          <Text style={s.coverScoreLabel}>Overall Score</Text>
          <View style={s.coverScoreRow}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={s.coverScoreNum}>{score}</Text>
              <Text style={s.coverScoreMax}>/100</Text>
            </View>
            <Text style={[s.coverGrade, gradeStyle(grade)]}>{grade}</Text>
            <Text style={s.coverSummary}>{summary}</Text>
          </View>

          <View style={s.coverRule} />

          <View style={s.coverStatsRow}>
            <View style={s.coverStatCell}>
              <Text style={s.coverStatVal}>~{monthlyVisitors}</Text>
              <Text style={s.coverStatLabel}>Monthly organic visitors</Text>
            </View>
            <View style={s.coverStatCell}>
              <Text style={s.coverStatVal}>{keywordsRanking}</Text>
              <Text style={s.coverStatLabel}>Keywords ranking on Google</Text>
            </View>
            <View style={s.coverStatCellLast}>
              <Text style={s.coverStatVal}>~{estimatedLostBookings}</Text>
              <Text style={s.coverStatLabel}>
                Estimated bookings lost / month
              </Text>
            </View>
          </View>

          <View style={s.coverMetaRow}>
            <Text style={s.coverMeta}>
              Prepared for{" "}
              <Text style={s.coverMetaStrong}>{name ?? "you"}</Text>
            </Text>
            <Text style={s.coverMeta}>{date}</Text>
            <Text style={s.coverMeta}>fontsandfooters.com/audit</Text>
          </View>
        </View>
      </Page>

      {/* ════════ SCORECARD ════════ */}
      <Page size='A4' style={s.pageLight}>
        <CornerDots color={C.black} />
        <Text style={s.scTitle}>
          The Scorecard: {score}/100 ({grade})
        </Text>
        <Text style={s.scIntro}>
          {name ? `Hi ${name} — we` : "We"} analyzed {domain} across six
          categories that decide whether you rank on Google and turn visitors
          into paying clients. Each check is marked passing or failing, with an
          impact rating showing what it costs you in bookings. Every failing
          check comes with a specific fix written for your site — not generic
          advice.
        </Text>

        <View style={s.legendRow}>
          <Text
            style={[
              s.legendItem,
              { backgroundColor: C.passBg, color: C.passInk },
            ]}
          >
            Passing
          </Text>
          <Text
            style={[s.legendItem, { backgroundColor: "#fdeaea", color: C.red }]}
          >
            Needs a fix
          </Text>
          <Text style={[s.legendItem, s.impactHigh]}>
            High · losing bookings now
          </Text>
          <Text style={[s.legendItem, s.impactMedium]}>
            Medium · limiting growth
          </Text>
          <Text style={[s.legendItem, s.impactLow]}>
            Low · worth addressing
          </Text>
        </View>

        {categories.map((cat, i) => {
          const fails = cat.checks.filter((c) => !c.passed).length;
          return (
            <View style={s.scRow} key={cat.id}>
              <Text style={s.scIndex}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={s.scLabel}>{cat.label}</Text>
              <Text style={s.scStatus}>
                {fails === 0
                  ? "All checks passing"
                  : `${fails} issue${fails !== 1 ? "s" : ""} to fix`}
              </Text>
              <Text style={s.scScore}>{cat.score}/100</Text>
              <Text style={[s.catGradeBadge, gradeStyle(cat.grade)]}>
                {cat.grade}
              </Text>
            </View>
          );
        })}
        <RunningFooter domain={domain} />
      </Page>

      {/* ════════ CATEGORY PAGES ════════ */}
      {categories.map((cat, ci) => {
        // chunk checks so a header is never stranded; ~3 cards per page
        const chunks: Check[][] = [];
        for (let i = 0; i < cat.checks.length; i += 3)
          chunks.push(cat.checks.slice(i, i + 3));
        return chunks.map((chunk, chunkIdx) => (
          <Page size='A4' style={s.pageLight} key={`${cat.id}-${chunkIdx}`}>
            <CornerDots color={C.black} />
            <View style={s.catHeadRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.catKicker}>
                  {String(ci + 1).padStart(2, "0")} / Category
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  <Text style={s.catTitle}>{cat.label}</Text>
                  {chunkIdx > 0 ? (
                    <Text style={s.catTitleCont}>CONTINUED</Text>
                  ) : (
                    <Text> </Text>
                  )}
                </View>
                {chunkIdx === 0 ? (
                  <Text style={s.catSubtitle}>
                    {catSubtitle(cat, lowestId)}
                  </Text>
                ) : (
                  <Text> </Text>
                )}
              </View>
              <View style={s.catScoreWrap}>
                <Text style={s.catScoreNum}>{cat.score}</Text>
                <Text style={s.catScoreMax}>/100</Text>
                <Text style={[s.catGradeBadge, gradeStyle(cat.grade)]}>
                  {cat.grade}
                </Text>
              </View>
            </View>
            <View style={s.catRule} />

            {chunk.map((chk) => {
              const ci2 = info(chk);
              return (
                <View style={s.card} key={chk.id} wrap={false}>
                  <View
                    style={[
                      s.cardAccent,
                      { backgroundColor: chk.passed ? C.green : C.red },
                    ]}
                  />
                  <View style={s.cardBody}>
                    <View style={s.cardTopRow}>
                      <View style={s.cardTopLeft}>
                        <Mark passed={chk.passed} />
                        <Text style={s.cardLabel}>{ci2.name}</Text>
                      </View>
                      <Text style={[s.impactBadge, impactStyle(chk.impact)]}>
                        {chk.impact}
                      </Text>
                    </View>
                    <Text style={s.cardWhy}>{ci2.why}</Text>
                    {chk.passed ? (
                      <View style={s.passBox}>
                        <Text style={s.passLabel}>Passing</Text>
                        <Text style={s.passText}>{ci2.positive}</Text>
                      </View>
                    ) : (
                      <View style={s.fixBox}>
                        <Text style={s.fixLabel}>The Fix</Text>
                        <Text style={s.fixText}>{chk.fix ?? chk.message}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            <RunningFooter domain={domain} />
          </Page>
        ));
      })}

      {/* ════════ DESIGN READ (auto) ════════ */}
      {design ? <DesignReadPage design={design} domain={domain} /> : null}

      {/* ════════ ROADMAP ════════ */}
      <Page size='A4' style={s.pageLight}>
        <CornerDots color={C.black} />
        <Text style={s.catKicker}>Summary &amp; Recommendations</Text>
        <Text style={s.scTitle}>What To Do, In Order.</Text>
        <View style={{ height: 18 }} />

        <View style={s.rmTwoCol}>
          <View style={s.rmCol}>
            <Text style={s.rmColHead}>What you&apos;re doing well</Text>
            <Text style={s.rmColText}>
              {strongLabels.length > 0
                ? `Your ${strongLabels.slice(0, 3).join(", ")} ${strongLabels.length === 1 ? "category" : "categories"} scored a perfect 100. That puts you ahead of most operators in this space and gives a strong base to build on.`
                : "This audit found a clear, fixable list of improvements. None of them require rebuilding your site from scratch."}
            </Text>
          </View>
          <View style={s.rmCol}>
            <Text style={s.rmColHead}>What&apos;s costing you bookings</Text>
            <Text style={s.rmColText}>
              {failingHigh.length > 0
                ? `${failingHigh.length} high-impact check${failingHigh.length !== 1 ? "s are" : " is"} actively losing you business — concentrated in ${weak
                    .slice(0, 2)
                    .map((c) => c.label.toLowerCase())
                    .join(" and ")}.`
                : "No critical high-impact issues — the remaining items are refinements that widen your lead."}
            </Text>
          </View>
        </View>

        {weak.slice(0, 3).map((cat, i) => (
          <View style={s.rmStep} key={cat.id}>
            <Text style={s.rmStepNum}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rmStepTitle}>{cat.label}</Text>
              <Text style={s.rmStepText}>
                {cat.checks
                  .filter((c) => !c.passed)
                  .map((c) => info(c).name)
                  .slice(0, 3)
                  .join(", ") ||
                  "Tighten the remaining medium and low items in this category."}
                {cat.checks.some((c) => !c.passed)
                  ? " — the fixes are detailed on the category pages above."
                  : ""}
              </Text>
            </View>
          </View>
        ))}

        <View style={s.rmImpact}>
          <Text style={s.rmImpactLabel}>Expected Impact</Text>
          <Text style={s.rmImpactText}>
            Across the {failingHigh.length} high-impact failing check
            {failingHigh.length !== 1 ? "s" : ""}, your site is estimated to be
            losing about {estimatedLostBookings} potential bookings a month. A
            focused effort on the fixes above — starting with the highest-impact
            items — could meaningfully raise your monthly booking volume within
            60 to 90 days, with no additional ad spend.
          </Text>
        </View>
        <RunningFooter domain={domain} />
      </Page>

      {/* ════════ CLOSING ════════ */}
      <Page size='A4' style={s.pageDark}>
        <View style={s.closePad}>
          <CornerDots color={C.white} />
          <View style={s.coverTopRow}>
            <View style={s.brandRow}>
              <Text style={s.brandName}>FONTS &amp; FOOTERS</Text>
            </View>
            <View style={s.eyebrowRow}>
              <View style={s.eyebrowBar} />
              <Text style={s.eyebrowText}>The Fix</Text>
            </View>
          </View>

          <Text style={s.closeH}>
            EVERY ISSUE{"\n"}IN THIS REPORT{"\n"}
            <Text style={s.closeHGold}>IS FIXABLE.</Text>
          </Text>

          <Text style={s.closeBody}>
            Fonts &amp; Footers builds direct-booking websites and growth tools
            exclusively for black car &amp; limo operators. We don&apos;t hand you a
            list of problems and walk away — we fix them, on a site built for
            how your clients actually book.
          </Text>

          <View style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Book a 20-minute walkthrough</Text>
            <View style={s.ctaArrow}>
              <Svg width={14} height={14} viewBox='0 0 24 24'>
                <Path
                  d='M5 12 H19 M13 6 L19 12 L13 18'
                  stroke='#fff'
                  strokeWidth={2.5}
                  fill='none'
                />
              </Svg>
            </View>
          </View>

          <View style={s.closeMetaRow}>
            <View style={s.closeMetaCell}>
              <Text style={s.closeMetaLabel}>Audit by</Text>
              <Text style={s.closeMetaVal}>Fonts &amp; Footers</Text>
            </View>
            <View style={s.closeMetaCell}>
              <Text style={s.closeMetaLabel}>For</Text>
              <Text style={s.closeMetaVal}>
                {name ? `${name} — ` : ""}
                {domain}
              </Text>
            </View>
            <View style={s.closeMetaCellLast}>
              <Text style={s.closeMetaLabel}>Online</Text>
              <Text style={s.closeMetaVal}>fontsandfooters.com/contact</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
