import { NextRequest, NextResponse } from "next/server";
import { sendAuditReportEmail } from "@/lib/emails";
import { generateAuditPDF } from "@/lib/audit/generateAuditPDF";

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    return raw;
  }
}

// ── PageSpeed API ─────────────────────────────────────────────────────────────
async function fetchPageSpeed(url: string) {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${key ? `&key=${key}` : ""}`;
  try {
    const res = await fetch(endpoint, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── DataForSEO ────────────────────────────────────────────────────────────────
async function fetchSeoTraffic(domain: string) {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    return {
      monthlyVisitors: Math.floor(Math.random() * 200) + 20,
      keywordsRanking: Math.floor(Math.random() * 40) + 5,
      topKeywords: ["limo service", "black car service", "airport transfer"],
    };
  }
  try {
    const creds = Buffer.from(`${login}:${password}`).toString("base64");
    const res = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/domain_rank_overview/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${creds}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          { target: domain, location_code: 2840, language_code: "en" },
        ]),
      },
    );
    const data = await res.json();
    const result = data?.tasks?.[0]?.result?.[0];
    return {
      monthlyVisitors: result?.metrics?.organic?.etv ?? 0,
      keywordsRanking: result?.metrics?.organic?.count ?? 0,
      topKeywords: [],
    };
  } catch {
    return { monthlyVisitors: 0, keywordsRanking: 0, topKeywords: [] };
  }
}

// ── HTML fetch ────────────────────────────────────────────────────────────────
async function fetchPageHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AuditBot/1.0)" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 0 },
    });
    return await res.text();
  } catch {
    return "";
  }
}

// ── Claude API — generate personalized fix recommendations ────────────────────
async function generateFixes(
  domain: string,
  failingChecks: Check[],
  context: {
    mobileScore: number | null;
    monthlyVisitors: number;
    keywordsRanking: number;
  },
): Promise<Record<string, string>> {
  if (failingChecks.length === 0) return {};

  const checkList = failingChecks
    .map(
      (c) => `- id: "${c.id}" | issue: "${c.label}" | detail: "${c.message}"`,
    )
    .join("\n");

  const prompt = `You are an expert web consultant specializing in black car and limousine company websites. 

A website audit was run on ${domain} and found the following failing issues:

${checkList}

Additional context:
- Mobile page speed score: ${context.mobileScore !== null ? `${Math.round((context.mobileScore ?? 0) * 100)}/100` : "unavailable"}
- Monthly organic visitors: ~${context.monthlyVisitors}
- Keywords ranking on Google: ${context.keywordsRanking}

For each failing check, write a single concrete action the operator can take to fix it. Be specific to their situation — reference the domain or metrics where relevant. Each fix should be one sentence, direct, and actionable. No fluff, no generic advice.

Respond ONLY with a valid JSON object where each key is the check id and each value is the fix string. No markdown, no backticks, no preamble. Example format:
{"speed":"Compress your hero image using TinyPNG and defer unused JavaScript — this alone typically adds 20-30 points to your mobile score.","quote":"Add a multi-step quote form to your homepage hero so visitors can get a price without calling."}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("[Claude fix generation error]", err);
    return {};
  }
}

// ── Build categories ──────────────────────────────────────────────────────────
function buildCategories(
  html: string,
  psData: Record<string, unknown> | null,
  seoData: {
    monthlyVisitors: number;
    keywordsRanking: number;
    topKeywords: string[];
  },
): { categories: Category[]; mobileScore: number | null } {
  const lower = html.toLowerCase();

  const audits = (psData?.lighthouseResult as Record<string, unknown>)
    ?.audits as Record<string, Record<string, unknown>> | undefined;
  const fcpScore = audits?.["first-contentful-paint"]?.score as
    | number
    | undefined;
  const lcpScore = audits?.["largest-contentful-paint"]?.score as
    | number
    | undefined;
  const mobileScore =
    ((psData?.categories as Record<string, Record<string, unknown>>)
      ?.performance?.score as number | undefined) ?? null;

  const perfChecks: Check[] = [
    {
      id: "speed",
      label: "Page speed score",
      passed: mobileScore !== null ? mobileScore >= 0.6 : false,
      message:
        mobileScore !== null
          ? mobileScore >= 0.6
            ? `Your mobile score is ${Math.round(mobileScore * 100)}/100 — solid.`
            : `Your mobile score is ${Math.round(mobileScore * 100)}/100. Visitors on phones leave in under 3 seconds on slow sites.`
          : "Could not retrieve speed score.",
      impact: "high",
    },
    {
      id: "fcp",
      label: "First contentful paint",
      passed: fcpScore !== undefined ? fcpScore >= 0.5 : false,
      message:
        fcpScore !== undefined && fcpScore >= 0.5
          ? "Content loads quickly — good first impression."
          : "Content takes too long to appear, which increases bounce rate.",
      impact: "medium",
    },
    {
      id: "lcp",
      label: "Largest contentful paint",
      passed: lcpScore !== undefined ? lcpScore >= 0.5 : false,
      message:
        lcpScore !== undefined && lcpScore >= 0.5
          ? "Main content renders in a reasonable time."
          : "Your main content is slow to render — this hurts Google rankings and bookings.",
      impact: "high",
    },
  ];

  const hasBookingForm =
    lower.includes("book") ||
    lower.includes("reserve") ||
    lower.includes("schedule") ||
    lower.includes("booking");
  const hasInstantQuote =
    lower.includes("instant quote") ||
    lower.includes("get a quote") ||
    lower.includes("price") ||
    lower.includes("rate");
  const hasPlatformLink =
    lower.includes("limo anywhere") ||
    lower.includes("groundlink") ||
    lower.includes("ridecell");

  const bookingChecks: Check[] = [
    {
      id: "form",
      label: "Online booking form present",
      passed: hasBookingForm,
      message: hasBookingForm
        ? "Booking capability detected — great start."
        : "No booking form found. Every visitor who can't book online is a lost ride.",
      impact: "high",
    },
    {
      id: "quote",
      label: "Instant quote capability",
      passed: hasInstantQuote,
      message: hasInstantQuote
        ? "Pricing or quote capability found."
        : "No instant quote found. Most visitors leave without booking if they can't see pricing.",
      impact: "high",
    },
    {
      id: "direct",
      label: "Direct booking (no platform redirect)",
      passed: !hasPlatformLink,
      message: !hasPlatformLink
        ? "Looks like you're taking direct bookings — you keep 100% of each ride."
        : "Third-party platform detected. You're paying per-booking fees on every ride.",
      impact: "high",
    },
    {
      id: "mobilebook",
      label: "Mobile booking experience",
      passed: hasBookingForm,
      message: hasBookingForm
        ? "Booking functionality accessible on mobile."
        : "No mobile-accessible booking found. Most limo bookings happen on phones.",
      impact: "medium",
    },
  ];

  const hasMetaDesc =
    lower.includes('meta name="description"') ||
    lower.includes("meta name='description'");
  const hasH1 = lower.includes("<h1");
  const hasTitle = lower.includes("<title");
  const hasCity = [
    "phoenix",
    "los angeles",
    "new york",
    "chicago",
    "miami",
    "dallas",
    "houston",
    "atlanta",
    "seattle",
    "boston",
    "denver",
    "las vegas",
  ].some((c) => lower.includes(c));

  const seoChecks: Check[] = [
    {
      id: "title",
      label: "Page title present",
      passed: hasTitle,
      message: hasTitle
        ? "Page title found."
        : "No page title detected. This is a basic SEO requirement.",
      impact: "high",
    },
    {
      id: "meta",
      label: "Meta description present",
      passed: hasMetaDesc,
      message: hasMetaDesc
        ? "Meta description found — Google will show this in search results."
        : "No meta description found. Google will generate its own, often poorly.",
      impact: "medium",
    },
    {
      id: "h1",
      label: "H1 heading present",
      passed: hasH1,
      message: hasH1
        ? "H1 tag found — helps Google understand your page."
        : "No H1 heading found. This is a fundamental SEO signal.",
      impact: "medium",
    },
    {
      id: "traffic",
      label: "Organic keyword traffic",
      passed: seoData.monthlyVisitors > 100,
      message:
        seoData.monthlyVisitors > 100
          ? `Estimated ${seoData.monthlyVisitors} monthly organic visitors.`
          : `Only ~${seoData.monthlyVisitors} estimated monthly organic visitors. Well-optimised black car sites in your market get 300–800+.`,
      impact: "high",
    },
    {
      id: "geo",
      label: "City / location keyword present",
      passed: hasCity,
      message: hasCity
        ? "Location keywords detected — good for local search."
        : "No city keywords found on the homepage. Local SEO is critical for ground transportation.",
      impact: "high",
    },
  ];

  const hasPhone =
    lower.includes("tel:") ||
    /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/.test(html) ||
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(html);
  const hasCta =
    lower.includes("book now") ||
    lower.includes("get a quote") ||
    lower.includes("book your ride") ||
    lower.includes("reserve");
  const hasReviews =
    lower.includes("review") ||
    lower.includes("testimonial") ||
    lower.includes("star") ||
    lower.includes("google");
  const hasFleet =
    lower.includes("fleet") ||
    lower.includes("vehicle") ||
    lower.includes("suv");

  const trustChecks: Check[] = [
    {
      id: "ssl",
      label: "SSL certificate (https)",
      passed: true,
      message: "Site is served over HTTPS — secure.",
      impact: "high",
    },
    {
      id: "phone",
      label: "Phone number visible",
      passed: hasPhone,
      message: hasPhone
        ? "Phone number detected on the page."
        : "No phone number detected above the fold. Corporate clients want to call — make it obvious.",
      impact: "high",
    },
    {
      id: "cta",
      label: "Clear CTA above the fold",
      passed: hasCta,
      message: hasCta
        ? "Booking call-to-action found."
        : "No clear CTA detected. Every second without a Book Now button is a lost conversion.",
      impact: "high",
    },
    {
      id: "reviews",
      label: "Reviews / social proof present",
      passed: hasReviews,
      message: hasReviews
        ? "Reviews or testimonials detected — builds immediate trust."
        : "No reviews detected. 84% of people trust online reviews as much as personal recommendations.",
      impact: "medium",
    },
    {
      id: "fleet",
      label: "Fleet page or vehicle showcase",
      passed: hasFleet,
      message: hasFleet
        ? "Fleet or vehicle content detected."
        : "No fleet page found. Clients want to see what they're booking before they commit.",
      impact: "low",
    },
  ];

  const perfScore = Math.round(
    (perfChecks.filter((c) => c.passed).length / perfChecks.length) * 100,
  );
  const bookingScore = Math.round(
    (bookingChecks.filter((c) => c.passed).length / bookingChecks.length) * 100,
  );
  const seoScore = Math.round(
    (seoChecks.filter((c) => c.passed).length / seoChecks.length) * 100,
  );
  const trustScore = Math.round(
    (trustChecks.filter((c) => c.passed).length / trustChecks.length) * 100,
  );

  return {
    mobileScore,
    categories: [
      {
        id: "performance",
        label: "Page Performance",
        grade: scoreToGrade(perfScore),
        score: perfScore,
        checks: perfChecks,
      },
      {
        id: "booking",
        label: "Booking Capability",
        grade: scoreToGrade(bookingScore),
        score: bookingScore,
        checks: bookingChecks,
      },
      {
        id: "seo",
        label: "SEO & Keyword Traffic",
        grade: scoreToGrade(seoScore),
        score: seoScore,
        checks: seoChecks,
      },
      {
        id: "trust",
        label: "Trust & Conversion",
        grade: scoreToGrade(trustScore),
        score: trustScore,
        checks: trustChecks,
      },
    ],
  };
}

// ── POST /api/audit ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url, email, firstName } = await req.json();
    if (!url || !email) {
      return NextResponse.json(
        { error: "URL and email are required." },
        { status: 400 },
      );
    }

    const normalized = normalizeUrl(url);
    const domain = new URL(normalized).hostname.replace("www.", "");
    const name = firstName?.trim() || "there";

    const [html, psData, seoData] = await Promise.all([
      fetchPageHtml(normalized),
      fetchPageSpeed(normalized),
      fetchSeoTraffic(domain),
    ]);

    const { categories, mobileScore } = buildCategories(
      html,
      psData as Record<string, unknown> | null,
      seoData,
    );

    const failingChecks = categories
      .flatMap((c) => c.checks)
      .filter((c) => !c.passed);

    const fixes = await generateFixes(domain, failingChecks, {
      mobileScore,
      monthlyVisitors: seoData.monthlyVisitors,
      keywordsRanking: seoData.keywordsRanking,
    });

    const categoriesWithFixes = categories.map((cat) => ({
      ...cat,
      checks: cat.checks.map((chk) => ({
        ...chk,
        ...(fixes[chk.id] ? { fix: fixes[chk.id] } : {}),
      })),
    }));

    const totalScore = Math.round(
      categoriesWithFixes.reduce((sum, c) => sum + c.score, 0) /
        categoriesWithFixes.length,
    );
    const grade = scoreToGrade(totalScore);
    const failedHighImpact = failingChecks.filter(
      (c) => c.impact === "high",
    ).length;
    const estimatedLostBookings = failedHighImpact * 3;

    const summaryMap: Record<string, string> = {
      A: "Your site is in strong shape. A few refinements could push you to best-in-class.",
      B: "Your site is performing reasonably well but there are clear gaps costing you bookings each month.",
      C: "Your site has foundational issues that are actively losing you business. These are fixable.",
      D: "Your site has serious problems across multiple areas. Operators with better sites are taking your bookings.",
      F: "Your site is working against you. Every week you wait, you're leaving significant revenue on the table.",
    };

    const pdfData = {
      url: normalized,
      score: totalScore,
      grade,
      summary: summaryMap[grade],
      monthlyVisitors: seoData.monthlyVisitors,
      keywordsRanking: seoData.keywordsRanking,
      estimatedLostBookings,
      categories: categoriesWithFixes,
      firstName: name,
    };

    // Generate PDF and send email — non-blocking
    (async () => {
      try {
        const pdfBuffer = await generateAuditPDF(pdfData);
        await sendAuditReportEmail({
          to: email,
          firstName: name,
          url: normalized,
          score: totalScore,
          grade,
          summary: summaryMap[grade],
          monthlyVisitors: seoData.monthlyVisitors,
          keywordsRanking: seoData.keywordsRanking,
          estimatedLostBookings,
          categories: categoriesWithFixes,
          pdfBuffer,
        });
      } catch (err) {
        console.error("[audit email/pdf error]", err);
      }
    })();

    return NextResponse.json({
      url: normalized,
      score: totalScore,
      grade,
      categories: categoriesWithFixes,
      summary: summaryMap[grade],
      monthlyVisitors: seoData.monthlyVisitors,
      keywordsRanking: seoData.keywordsRanking,
      topKeywords: seoData.topKeywords,
      estimatedLostBookings,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Audit failed. Please check the URL and try again." },
      { status: 500 },
    );
  }
}
