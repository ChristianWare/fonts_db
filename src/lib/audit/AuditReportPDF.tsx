/* eslint-disable jsx-a11y/alt-text */
// lib/audit/AuditReportPDF.tsx
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { auditPdfStyles as s } from "./AuditReportPDF.styles";
// import LogoImg from "../../../public/logos/fnf_logo_black.png";

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

// ── Check descriptions ────────────────────────────────────────────────────────
const CHECK_INFO: Record<
  string,
  { name: string; what: string; why: string; positive: string }
> = {
  speed: {
    name: "Page Speed Score",
    what: "Google scores your website's loading speed on mobile devices from 0 to 100.",
    why: "Why it matters: Most limo bookings happen on phones. A slow site causes visitors to leave before they ever reach your booking form — typically within 3 seconds.",
    positive:
      "Your site loads fast on mobile — visitors stay longer and are more likely to complete a booking.",
  },
  fcp: {
    name: "First Contentful Paint",
    what: "The time it takes for the first piece of content — text, image, or logo — to appear on screen after someone opens your site.",
    why: "Why it matters: If nothing loads within a second or two, visitors assume the site is broken and hit the back button.",
    positive:
      "Your content appears quickly on load — visitors see your site right away, which reduces bounce rate.",
  },
  lcp: {
    name: "Largest Contentful Paint",
    what: "The time it takes for the main content on your page — typically your hero image or headline — to fully load.",
    why: "Why it matters: This is Google's top performance metric and directly affects where you rank in search results.",
    positive:
      "Your main content loads in a reasonable time — this positively affects your Google search rankings.",
  },
  form: {
    name: "Online Booking Form",
    what: "Whether your site has a form or button that lets visitors request or complete a booking online without calling.",
    why: "Why it matters: Operators without online booking lose every visitor who won't pick up a phone — which is the majority of modern customers.",
    positive:
      "You have online booking capability — visitors can take action without calling, which significantly increases conversion.",
  },
  quote: {
    name: "Instant Quote",
    what: "Whether visitors can get a price estimate directly on your site without having to call first.",
    why: "Why it matters: People make booking decisions based on price. Without a visible number, most visitors move on to a competitor who shows one.",
    positive:
      "You offer pricing or quoting on your site — this gives visitors the confidence to book rather than shop around.",
  },
  direct: {
    name: "Direct Booking",
    what: "Whether your reservations go directly to you or are processed through a third-party platform that charges per-booking fees.",
    why: "Why it matters: Third-party platforms take a cut of every ride. Over the course of a year, that adds up to thousands of dollars leaving your business.",
    positive:
      "Your bookings appear to go directly to you — you're keeping 100% of each ride instead of paying platform fees.",
  },
  mobilebook: {
    name: "Mobile Booking Experience",
    what: "Whether the booking process works properly and looks good on a smartphone screen.",
    why: "Why it matters: Over 70% of transportation searches happen on mobile. A booking form that doesn't work on phones loses most of your potential customers.",
    positive:
      "Your booking functionality is accessible on mobile — you're capturing the majority of visitors browsing on their phones.",
  },
  title: {
    name: "Page Title",
    what: "The title that appears in the browser tab and as the headline in Google search results.",
    why: "Why it matters: Without a page title, Google has no idea what your page is about and will not rank it for any relevant searches.",
    positive:
      "Your page has a title tag — a foundational SEO requirement that helps Google understand and rank your site.",
  },
  meta: {
    name: "Meta Description",
    what: "The short description that appears under your business name in Google search results.",
    why: "Why it matters: A specific, compelling meta description increases the number of people who click your listing over a competitor's.",
    positive:
      "You have a meta description — this helps your Google listing stand out and encourages people to click through.",
  },
  h1: {
    name: "H1 Heading",
    what: "The primary heading on your homepage — the first large text a visitor reads when they arrive.",
    why: "Why it matters: Google uses the H1 tag to understand what your page is about. It is one of the most basic and important SEO signals on any webpage.",
    positive:
      "Your page has an H1 heading — this tells both visitors and Google clearly what your page is about.",
  },
  traffic: {
    name: "Organic Keyword Traffic",
    what: "An estimate of how many people find your site through Google each month without paid advertising.",
    why: "Why it matters: Organic traffic is free, compounds over time, and is the most valuable long-term source of bookings for any transportation business.",
    positive:
      "Your site is getting meaningful organic traffic from Google — people are finding you without paid ads, which means your SEO is working.",
  },
  geo: {
    name: "Location Keywords",
    what: "Whether your homepage includes the name of the city or region you serve.",
    why: "Why it matters: Searches like 'black car service Phoenix' are your highest-converting traffic source. Without location keywords, you will not rank for them.",
    positive:
      "Your homepage includes location keywords — this helps you appear in local searches from potential clients in your service area.",
  },
  sitemap: {
    name: "XML Sitemap",
    what: "A file at yoursite.com/sitemap.xml that lists every page on your website so search engines can find and index them all.",
    why: "Why it matters: Without a sitemap, Google may miss pages on your site entirely — meaning those pages will never appear in search results.",
    positive:
      "Your site has an XML sitemap — Google can find and index all of your pages efficiently.",
  },
  robots: {
    name: "Robots.txt File",
    what: "A file at yoursite.com/robots.txt that tells search engine crawlers which pages they are allowed to visit.",
    why: "Why it matters: A missing or misconfigured robots.txt can accidentally block Google from crawling your entire site.",
    positive:
      "Your robots.txt file is present — search engine crawlers can navigate your site correctly.",
  },
  ssl: {
    name: "SSL Certificate (HTTPS)",
    what: "The security certificate that displays the padlock icon in your browser and places https:// in your web address.",
    why: "Why it matters: Google penalizes sites without SSL. Visitors who see a 'Not Secure' warning in their browser will leave immediately.",
    positive:
      "Your site is secured with HTTPS — visitors see a padlock in their browser, which builds immediate trust.",
  },
  phone: {
    name: "Phone Number Visible",
    what: "Whether a phone number is clearly displayed on your homepage without any scrolling required.",
    why: "Why it matters: Corporate clients and first-time bookers often want to call before committing. A hard-to-find phone number loses those customers.",
    positive:
      "Your phone number is visible on the page — corporate clients and first-time bookers can reach you immediately.",
  },
  cta: {
    name: "Call to Action (CTA)",
    what: "A prominent button or link that tells visitors exactly what to do next — such as Book Now, Get a Quote, or Reserve.",
    why: "Why it matters: Without a clear next step visible above the fold, visitors leave without taking any action regardless of how good your service is.",
    positive:
      "You have a clear call to action on your page — visitors know exactly what to do next, which drives bookings.",
  },
  reviews: {
    name: "Reviews and Social Proof",
    what: "Whether your site displays testimonials, star ratings, or customer reviews from real clients.",
    why: "Why it matters: 84% of people trust online reviews as much as a personal recommendation. Operators without visible reviews lose trust before a visitor reads anything.",
    positive:
      "You have reviews or testimonials visible — this builds immediate credibility with new visitors who don't know your business yet.",
  },
  fleet: {
    name: "Fleet or Vehicle Showcase",
    what: "A dedicated section or page showing photos and details of the vehicles you offer.",
    why: "Why it matters: Clients want to see what they are booking before they commit. A fleet page builds confidence and directly increases conversion rates.",
    positive:
      "You showcase your fleet or vehicles — clients can see what they're booking, which builds confidence and increases conversions.",
  },
  platform: {
    name: "Site Platform",
    what: "The technology or content management system used to build your website — such as WordPress, Wix, Squarespace, or a custom framework.",
    why: "Why it matters: Some platforms severely limit your ability to customize booking flows, optimize page speed, and control your SEO — all of which cost you bookings.",
    positive:
      "Your site is built on a capable platform — this gives you the technical flexibility to optimize your booking experience and SEO.",
  },
  bookingplatform: {
    name: "Third-Party Booking Platform",
    what: "Whether your site uses an external service to handle reservations rather than taking bookings directly.",
    why: "Why it matters: Third-party booking platforms charge a fee on every single booking. Over a year, this adds up to thousands of dollars that could stay in your business.",
    positive:
      "No third-party booking platform was detected — you appear to be taking direct bookings and keeping 100% of your revenue.",
  },
  analytics: {
    name: "Web Analytics",
    what: "Tools installed on your site that track who visits, where they came from, and what actions they take.",
    why: "Why it matters: Without analytics, you have no way to know which marketing channels are working, where visitors drop off, or how many people leave without booking.",
    positive:
      "You have web analytics installed — you can see where your visitors come from and how they behave, giving you data to make smart improvements.",
  },
  schema: {
    name: "Schema Markup",
    what: "Structured data code added to your site that helps Google understand your business type, location, and services.",
    why: "Why it matters: Schema markup directly improves how your business appears in local search results and can enable rich results like star ratings within Google.",
    positive:
      "Your site has schema markup — Google can better understand your business type and location, which helps you appear in local searches.",
  },
  sociallinks: {
    name: "Social Media Links",
    what: "Links on your website pointing to your business profiles on platforms like Instagram, Facebook, or LinkedIn.",
    why: "Why it matters: Social links give potential clients additional ways to verify your legitimacy and see your work before they commit to a booking.",
    positive:
      "You link to your social media profiles — this gives visitors additional ways to verify your business and build trust.",
  },
  favicon: {
    name: "Favicon",
    what: "The small icon that appears in the browser tab next to your website name when someone has your site open.",
    why: "Why it matters: A missing favicon signals an unfinished site. It erodes trust before a visitor has read a single word.",
    positive:
      "Your site has a favicon — this small detail signals a polished, professionally maintained website.",
  },
  copyright: {
    name: "Copyright Year",
    what: "The year displayed in the copyright notice in your website footer.",
    why: "Why it matters: An outdated copyright year signals to both visitors and search engines that the site is not being actively maintained.",
    positive:
      "Your copyright year is current — this signals to visitors and Google that your site is actively maintained.",
  },
  viewport: {
    name: "Mobile Viewport",
    what: "A meta tag that tells browsers how to scale and display your website correctly on phones and tablets.",
    why: "Why it matters: Without this tag, your site renders as a shrunken desktop version on mobile devices — making text tiny, buttons untappable, and forms impossible to fill out.",
    positive:
      "Your site has a mobile viewport tag — it is configured to display correctly across phones and tablets, giving mobile visitors a proper experience.",
  },
  heroimages: {
    name: "Real Homepage Imagery",
    what: "Whether your homepage features actual photographs — of your fleet, drivers, or service — rather than just text, icons, or no images at all.",
    why: "Why it matters: Premium transportation clients make emotional decisions before they book. A homepage with no real photography signals that there is no real brand behind the service.",
    positive:
      "Your homepage has real imagery — visual content makes a strong first impression and helps clients connect with your brand before they ever call or book.",
  },
  stockphotos: {
    name: "Original Photography",
    what: "Whether your site uses original photos of your actual operation or generic stock images from services like Shutterstock or Getty Images.",
    why: "Why it matters: Clients booking a premium black car service want to see your actual vehicles and team. Stock photos of anonymous sedans signal that you have no real brand identity worth investing in.",
    positive:
      "No stock photo services detected — your imagery appears to be original, which builds authenticity and gives clients a genuine sense of what your operation looks like.",
  },
  defaulttheme: {
    name: "Custom Design",
    what: "Whether your site uses a default, out-of-the-box theme or has been designed and customized to reflect your specific brand.",
    why: "Why it matters: Default WordPress and website builder themes make your site look identical to thousands of other small businesses. For a premium service, your website should visually communicate the quality of your offering.",
    positive:
      "Your site appears to use a custom or heavily customized design — this helps you stand apart from competitors running uncustomized templates.",
  },
  fontoverload: {
    name: "Typography Discipline",
    what: "The number of different font families your homepage loads. Well-designed sites typically use one or two fonts consistently throughout.",
    why: "Why it matters: Loading multiple font families slows your page and creates a visually inconsistent experience that feels DIY and amateurish to discerning corporate clients.",
    positive:
      "Your typography appears clean and disciplined — a focused font palette contributes to a professional, cohesive visual identity across your site.",
  },
  inlinestyles: {
    name: "Design System Quality",
    what: "Whether your site uses a consistent design system or relies heavily on inline styles — a pattern common in template-built and page-builder sites.",
    why: "Why it matters: Excessive inline styles indicate a site assembled without design discipline, which typically results in visual inconsistency across pages and a poor experience on different screen sizes.",
    positive:
      "Your site's code structure looks clean with no excessive inline styling — this suggests a more purposeful, well-built design system underneath.",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Written summary ───────────────────────────────────────────────────────────
function buildWrittenSummary(categories: Category[], domain: string) {
  const allChecks = categories.flatMap((c) => c.checks);
  const failingHigh = allChecks.filter((c) => !c.passed && c.impact === "high");
  const passingHigh = allChecks.filter((c) => c.passed && c.impact === "high");
  const weakCategories = [...categories]
    .filter((c) => c.score < 75)
    .sort((a, b) => a.score - b.score);
  const strongCategories = categories.filter((c) => c.score >= 75);
  const strengthNames = passingHigh
    .slice(0, 3)
    .map((c) => (CHECK_INFO[c.id]?.name ?? c.label).toLowerCase());
  const weakNames = failingHigh
    .slice(0, 3)
    .map((c) => (CHECK_INFO[c.id]?.name ?? c.label).toLowerCase());
  const weakestCat = weakCategories[0];
  const strongCatNames = strongCategories.map((c) => c.label.toLowerCase());

  let strengths = "";
  if (strengthNames.length >= 2) {
    strengths = `${domain} has a solid foundation in several key areas. ${strengthNames
      .slice(0, 2)
      .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
      .join(
        " and ",
      )} are working in your favor — these are the signals that build trust with corporate and repeat clients and support long-term organic growth. ${strongCatNames.length > 0 ? `Your ${strongCatNames[0]} category scored particularly well, which puts you ahead of many operators in this space.` : ""}`;
  } else if (strengthNames.length === 1) {
    strengths = `${domain} performs well in ${strengthNames[0]}. This gives you a competitive foundation to build from. The goal now is to shore up the weaker areas so your entire site is working as hard as your best-performing section.`;
  } else {
    strengths = `This audit identified significant opportunities for improvement across all key areas of your site. The good news — every issue found in this report has a clear, documented fix, and none of them require rebuilding your site from scratch.`;
  }

  let improvements = "";
  if (weakNames.length >= 2) {
    improvements = `The highest-priority improvements are ${weakNames[0]} and ${weakNames[1]}${weakNames.length >= 3 ? `, along with ${weakNames[2]}` : ""}. These are high-impact issues that are actively costing you bookings every week. Each has a specific, actionable fix outlined in this report. Addressing them in order — starting with the highest-impact items first — will produce the most significant results in the shortest time.`;
  } else if (weakNames.length === 1) {
    improvements = `The top priority improvement is ${weakNames[0]}. This is a high-impact issue with a clear fix outlined in this report. Addressing it quickly should produce a noticeable improvement in your booking conversion rate.`;
  } else {
    improvements = `No critical high-impact issues were found. Focus on the medium-priority improvements identified in this report to continue optimizing your site and widening your competitive lead.`;
  }

  let impact = "";
  if (weakestCat && failingHigh.length > 0) {
    impact = `Based on the ${failingHigh.length} high-impact failing check${failingHigh.length !== 1 ? "s" : ""} identified in this report, your site is estimated to be losing approximately ${failingHigh.length * 3} potential bookings per month. Your ${weakestCat.label.toLowerCase()} category scored ${weakestCat.score}/100 and represents your single biggest opportunity for improvement. A focused effort on the fixes outlined in this report could meaningfully increase your monthly booking volume within 60 to 90 days without any additional ad spend.`;
  } else if (failingHigh.length === 0) {
    impact = `Your site is in strong shape with no critical high-impact issues identified. The remaining improvements in this report are refinements that will help you maintain your competitive advantage and incrementally increase conversions over time.`;
  } else {
    impact = `Addressing the improvements outlined in this report has the potential to meaningfully increase your monthly booking volume. The fixes are targeted and specific — you do not need to rebuild your site. Even resolving two or three of the highest-impact items could produce measurable results within 30 to 60 days.`;
  }

  return { strengths, improvements, impact };
}

// ── Component ─────────────────────────────────────────────────────────────────
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
}: AuditReportPDFProps) {
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  const allChecks = categories.flatMap((c) => c.checks);
  const { strengths, improvements, impact } = buildWrittenSummary(
    categories,
    domain,
  );
  const name = firstName && firstName !== "there" ? firstName : null;

  return (
    <Document>
      <Page size='A4' style={s.page}>
        {/* ═══════════════════════════════════════════
            PAGE 1 — Header + Introduction
        ═══════════════════════════════════════════ */}

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

        <View style={s.summaryBar}>
          <Text style={s.summaryText}>{summary}</Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statCell}>
            <Text style={s.statVal}>~ {monthlyVisitors}</Text>
            <Text style={s.statLabel}>Monthly organic visitors</Text>
          </View>
          <View style={s.statCell}>
            <Text style={s.statVal}>{keywordsRanking}</Text>
            <Text style={s.statLabel}>Keywords ranking</Text>
          </View>
          <View style={s.statCellLast}>
            <Text style={s.statValRed}>~ {estimatedLostBookings}</Text>
            <Text style={s.statLabel}>Est. bookings lost/month</Text>
          </View>
        </View>

        <View style={s.introSection}>
          <Text style={s.introTitle}>About This Report</Text>
          <Text style={s.introPara}>
            {name ? `Hi ${name}, this` : "This"} report was generated by Fonts &
            Footers — a web agency that builds custom booking websites
            exclusively for black car and limousine operators. Your website was
            analyzed across 6 categories covering every factor that directly
            affects your ability to rank on Google and convert visitors into
            paying clients.
          </Text>
          <Text style={s.introSubhead}>What We Checked</Text>
          <View style={s.introCategoryList}>
            {[
              "Page Performance",
              "Booking Capability",
              "SEO & Keyword Traffic",
              "Trust & Conversion",
              "Tech Stack",
              "Brand & Design",
            ].map((cat) => (
              <Text key={cat} style={s.introCategoryPill}>
                {cat}
              </Text>
            ))}
          </View>
          <Text style={s.introSubhead}>How To Read This Report</Text>
          <Text style={s.introPara}>
            Each check is marked passing (✓) or failing (✗) alongside an impact
            rating indicating how significantly that issue is costing you in
            potential bookings.
          </Text>
          <View style={s.introImpactRow}>
            {/* <Image
              src='https://fontsandfooters.com/logos/fnf_logo_black.png'
              style={s.logoImage}
            /> */}
            <View style={s.introImpactItem}>
              <Text style={[s.introImpactDot, { color: "#ff0026" }]}>●</Text>
              <Text style={s.introImpactLabel}>
                HIGH — Directly losing bookings right now
              </Text>
            </View>
            <View style={s.introImpactItem}>
              <Text style={[s.introImpactDot, { color: "#d97706" }]}>●</Text>
              <Text style={s.introImpactLabel}>
                MEDIUM — Limiting your growth
              </Text>
            </View>
            <View style={s.introImpactItem}>
              <Text style={[s.introImpactDot, { color: "#0e8e0e" }]}>●</Text>
              <Text style={s.introImpactLabel}>
                LOW — Worth addressing over time
              </Text>
            </View>
          </View>
          <Text style={s.introNote}>
            For every failing check, this report includes a personalized fix
            recommendation generated specifically for {domain} based on your
            site&apos;s actual data — not generic advice.
          </Text>
        </View>

        {/* ═══════════════════════════════════════════
            PAGE 2+ — Full Breakdown
            break prop forces this to start on a new page
        ═══════════════════════════════════════════ */}
        <View break style={s.body}>
          <Text style={s.sectionTitle}>Full Breakdown</Text>

          {/* Checklist overview */}
          <View style={s.checklistSection} wrap={false}>
            <View style={s.checklistSectionHeader}>
              <Text style={s.checklistSectionTitle}>
                Audit Checklist Overview
              </Text>
            </View>
            <View style={s.checklistGrid}>
              {allChecks.map((chk) => (
                <View key={chk.id} style={s.checklistItem}>
                  {/*
                    CHECKLIST ICONS: border applied directly to Text element.
                    This avoids the View centering issue that caused empty boxes.
                    Green border + green text = pass ✓
                    Red border + red text = fail ✗
                  */}
                  <Text
                    style={
                      chk.passed ? s.checklistIconPass : s.checklistIconFail
                    }
                  >
                    {chk.passed ? "✓" : "✗"}
                  </Text>
                  <Text style={s.checklistItemName}>
                    {CHECK_INFO[chk.id]?.name ?? chk.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Categories — split into chunks of 4 checks max
              CRITICAL: wrap={false} is on the CHUNK VIEW, not individual rows.
              This means the header + its checks always move together as one unit.
              A header can NEVER be stranded alone creating white space. */}
          {categories.map((cat) => {
            const categoryPassing = cat.score >= 75;

            // Split checks into max-4 chunks
            const chunks: Check[][] = [];
            for (let i = 0; i < cat.checks.length; i += 4) {
              chunks.push(cat.checks.slice(i, i + 4));
            }

            return chunks.map((chunk, chunkIdx) => {
              const isFirstChunk = chunkIdx === 0;
              const isLastChunk = chunkIdx === chunks.length - 1;

              return (
                // wrap={false} on the entire chunk keeps header + checks together.
                // If it doesn't fit on the current page, the WHOLE chunk moves to
                // the next page — the header is never left stranded with white space below it.
                <View
                  key={`${cat.id}-chunk-${chunkIdx}`}
                  style={
                    isFirstChunk ? s.categoryBlock : s.categoryBlockContinuation
                  }
                  wrap={false}
                >
                  {/* Full category header — first chunk only */}
                  {isFirstChunk && (
                    <View style={s.categoryHeader}>
                      <View style={s.categoryHeaderLeft}>
                        <Text
                          style={[
                            s.categoryStatusIcon,
                            categoryPassing
                              ? s.categoryStatusPass
                              : s.categoryStatusFail,
                          ]}
                        >
                          {categoryPassing ? "✓" : "✗"}
                        </Text>
                        <Text
                          style={[s.gradeBadgeSmall, gradeStyle(cat.grade)]}
                        >
                          {cat.grade}
                        </Text>
                        <Text style={s.categoryLabel}>{cat.label}</Text>
                      </View>
                      <Text style={s.categoryScore}>{cat.score}/100</Text>
                    </View>
                  )}

                  {/* Continuation header — subsequent chunks only */}
                  {!isFirstChunk && (
                    <View style={s.categoryHeaderContinued}>
                      <Text style={s.categoryHeaderContinuedLabel}>
                        {cat.label} (continued)
                      </Text>
                      <Text style={s.categoryScore}>{cat.score}/100</Text>
                    </View>
                  )}

                  {/* Check rows — no wrap={false} needed here since the
                      chunk view handles keeping everything together */}
                  {chunk.map((chk, idx) => {
                    const isLastInChunk = idx === chunk.length - 1;
                    const isLastInCategory = isLastChunk && isLastInChunk;
                    const info = CHECK_INFO[chk.id];

                    return (
                      <View
                        key={chk.id}
                        style={
                          isLastInChunk && isLastInCategory
                            ? s.checkRowLast
                            : s.checkRow
                        }
                      >
                        <Text
                          style={[
                            s.checkIcon,
                            chk.passed ? s.checkIconPass : s.checkIconFail,
                          ]}
                        >
                          {chk.passed ? "✓" : "✗"}
                        </Text>
                        <View style={s.checkContent}>
                          <Text style={s.checkLabel}>
                            {info?.name ?? chk.label}
                          </Text>
                          {info?.what && (
                            <Text style={s.checkWhat}>{info.what}</Text>
                          )}
                          {info?.why && (
                            <Text style={s.checkWhy}>{info.why}</Text>
                          )}
                          {chk.passed && info?.positive && (
                            <Text style={s.checkPositive}>
                              ✓ {info.positive}
                            </Text>
                          )}
                          {!chk.passed && chk.fix && (
                            <Text style={s.checkFix}>
                              → How to fix it: {chk.fix}
                            </Text>
                          )}
                        </View>
                        <Text style={[s.impactBadge, impactStyle(chk.impact)]}>
                          {chk.impact}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            });
          })}

          {/* Written summary */}
          <View style={s.auditSummarySection} wrap={false}>
            <View style={s.auditSummaryHeader}>
              <Text style={s.auditSummaryHeaderTitle}>
                Summary & Recommendations
              </Text>
            </View>
            <View style={s.auditSummaryBody}>
              <Text style={s.auditSummarySubheadFirst}>
                What you&apos;re doing well
              </Text>
              <Text style={s.auditSummaryText}>{strengths}</Text>
              <Text style={s.auditSummarySubhead}>What needs improvement</Text>
              <Text style={s.auditSummaryText}>{improvements}</Text>
              <Text style={s.auditSummarySubhead}>Expected impact</Text>
              <Text style={s.auditSummaryText}>{impact}</Text>
            </View>
          </View>
        </View>

        {/* CTA — pinned to bottom of every page via absolute positioning */}
        <View style={s.ctaAbsoluteWrapper}>
          <View style={s.logoWrap}>
            <Image
              src='https://fontsandfooters.com/logos/fnf_logo_black.png'
              style={s.logoImage}
            />
          </View>
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
          <View style={s.pdfFooter}>
            <Text style={s.pdfFooterText}>
              Audit generated by Fonts & Footers — fontsandfooters.com/audit
            </Text>
            <Text style={s.pdfFooterText}>{domain}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
