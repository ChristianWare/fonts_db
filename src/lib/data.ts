import Img1 from "../../public/images/branded.jpg";
import Img2 from "../../public/images/work.jpg";
import Img3 from "../../public/images/proven.jpg";
import Img4 from "../../public/images/system.jpg";
import Img5 from "../../public/images/earningsii.jpg";

import Img6 from "../../public/dashboard/bookings.png";
import Img7 from "../../public/dashboard/approve.png";
import Img8 from "../../public/dashboard/pricing.png";
import Img9 from "../../public/dashboard/driver.png";
import Img10 from "../../public/dashboard/alerts.png";
import Img11 from "../../public/dashboard/customers.png";
import Img12 from "../../public/dashboard/reports.png";
import Img13 from "../../public/dashboard/settings.png";

export const SolutionData = [
  {
    id: 1,
    oneWordDesc: "Branded",
    title: "Branded entirely to your company",
    src: Img1,
    description:
      "Your platform runs under your name, on your domain, in your colors — customers never see our name.",
    bullets: ["Your domain", "Your colors", "Your emails", "Your brand"],
  },
  {
    id: 2,
    oneWordDesc: "Custom",
    title: "Built around how you actually work",
    src: Img2,
    description:
      "We configure everything around your services, your vehicles, and your pricing — not a generic version of your business.",
    bullets: [
      "Your services",
      "Your vehicles",
      "Your pricing",
      "Your workflow",
    ],
  },
  {
    id: 3,
    oneWordDesc: "Proven",
    title: "Tested in a real, active operation",
    src: Img3,
    description:
      "Every feature was built and refined with a real black car operator — you're getting a platform that already works, not a prototype.",
    bullets: ["Real bookings", "Real drivers", "Real clients", "Battle-tested"],
  },
  {
    id: 4,
    oneWordDesc: "Complete",
    title: "Every role covered, one system",
    src: Img4,
    description:
      "Customers, drivers, admins, and corporate clients all have exactly what they need — and it all lives in one platform.",
    bullets: ["One dashboard", "Every role", "Zero gaps", "Fully connected"],
  },
  {
    id: 5,
    oneWordDesc: "Yours",
    title: "You keep everything you earn",
    src: Img5,
    description:
      "Flat monthly pricing, no per-booking fees, and no platform claiming ownership of your customers or your data.",
    bullets: ["Flat rate", "No fees", "Your data", "Cancel anytime"],
  },
] as const;

export const DashboardFeatures = [
  {
    id: 1,
    title: "Bookings Management",
    desc: "Every booking lands in your dashboard with full details — route, vehicle, passenger info, flight data, pricing, and payment status. Approve, edit, assign, and update directly. Bookings move through a clear status workflow: Pending, Confirmed, Assigned, In Progress, Completed.",
    src: Img6,
  },
  {
    id: 2,
    title: "Approve & Price Workflow",
    desc: "New bookings come in as pending. Review the details, set the final price with automatic calculation based on distance, vehicle, and your rate settings, then send confirmation to the rider — all from one screen.",
    src: Img7,
  },
  {
    id: 3,
    title: "Payment Management",
    desc: "See the full payment picture for every booking. Collect deposits, send balance payment links, mark trips as paid, issue refunds, and track outstanding balances — all in one place. Powered by Stripe.",
    src: Img8,
  },
  {
    id: 4,
    title: "Driver Assignment",
    desc: "Assign drivers from a dropdown of your available roster. The driver receives an automatic notification with their trip details. The dashboard flags conflicts so you never accidentally double-book a driver.",
    src: Img9,
  },
  {
    id: 5,
    title: "Smart Alerts",
    desc: "The dashboard home screen surfaces what needs your attention: bookings with outstanding balances, upcoming trips without an assigned driver, bookings stuck in review, and tip payments received in the last 24 hours.",
    src: Img10,
  },
  {
    id: 6,
    title: "Customer Management",
    desc: "A full directory of every customer who has ever booked with you — contact info, booking history, total spend, and account type. Easily distinguish between individual customers, corporate accounts, and guest bookers.",
    src: Img11,
  },
  {
    id: 7,
    title: "Reports & Analytics",
    desc: "Revenue by date range, bookings by service type, driver performance, top customers by spend, and conversion tracking. Export reports for accounting or use the built-in charts to spot trends.",
    src: Img12,
  },
  {
    id: 8,
    title: "Company Settings",
    desc: "Configure your company name, logo, contact info, service area, email sender details, and notification preferences — all from a single settings panel. No developer required for day-to-day changes.",
    src: Img13,
  },
] as const;

export const featureData = [
  {
    title: "Live Google Maps",
    desc: "Every booking automatically calculates the route, distance, and estimated drive time using live Google Maps data. Customers see exactly where they're going before they pay — no surprises, no guesswork.",
  },
  {
    title: "Payment Processing",
    desc: "All payments run through Stripe — secure, reliable, and familiar to your clients. Accept cards at booking, store payment methods for repeat customers, and collect deposits or full balances on your schedule.",
  },
  {
    title: "Flight Tracking",
    desc: "Customers enter their flight number at booking and the platform pulls live aviation data automatically. If a flight is delayed, the booking reflects it — your driver arrives when the passenger does, not an hour before.",
  },
  {
    title: "Guest Checkout",
    desc: "Customers can book a ride without creating an account — no friction, no barriers. If they want to save their details for next time, account creation is always available but never required.",
  },
  {
    title: "Gratuity",
    desc: "Tip selection is built directly into the checkout flow, so customers can add a gratuity before they even get in the car. Tips are tracked per driver and visible in your admin dashboard.",
  },
  {
    title: "Deposits",
    desc: "Collect a deposit at booking and send a balance payment link when the trip is complete. You control the deposit amount per service type — giving you flexibility without chasing payments after the fact.",
  },
  {
    title: "Confirmation Emails",
    desc: "Every booking triggers a branded confirmation email with full trip details, receipt, and a link to the customer portal. Your clients get exactly what they need, automatically, the moment they book.",
  },
  {
    title: "Customer Portal",
    desc: "Every rider gets access to a personal portal where they can view upcoming and past trips, download receipts, and save frequently used addresses. It's branded entirely to your company — your clients never see our name.",
  },
  {
    title: "Corporate Accounts",
    desc: "Business clients can apply for a corporate account directly through your platform. Once approved, they get centralized billing, employee management, and a dedicated booking experience built for business travel.",
  },
  {
    title: "Driver Portal",
    desc: "Every driver on your roster gets their own dedicated portal with their full trip schedule, passenger details, and real-time status updates. It installs like a native app on their phone — no App Store download required.",
  },
  {
    title: "Push Notifications",
    desc: "Drivers receive instant push notifications for new assignments, booking updates, and cancellations. No more phone calls to relay trip details — the platform handles it automatically.",
  },
  {
    title: "SEO",
    desc: "The platform auto-generates 640+ location and service pages targeting every city and service type in your market. Someone searching for black car service in your area finds you — not a directory or a competitor.",
  },
  {
    title: "Admin Dashboard",
    desc: "Your entire operation lives in one place — bookings, drivers, payments, customers, and reports all managed from a single screen. No spreadsheets, no separate apps, no information falling through the cracks.",
  },
  {
    title: "Smart Alerts",
    desc: "The dashboard home screen surfaces what needs your attention the moment you log in. Outstanding balances, unassigned drivers, stuck bookings, and recent tips are all flagged automatically so nothing gets missed.",
  },
  {
    title: "Invoice Generation",
    desc: "Professional PDF invoices are generated automatically for every completed booking. Corporate clients can download invoices directly from their portal — no manual work required on your end.",
  },
] as const;


export type SectionKey =
  | "home"
  | "pricing"
  | "about"
  | "work"
  | "blog"
  | "contact";

export type QuestionItem = {
  id: number;
  question: string;
  answer: string;
  sections: SectionKey[];
};

export const questions: readonly QuestionItem[] = [
  {
    id: 1,
    question: "What exactly does Fonts & Footers build?",
    answer:
      "We specialize in high-conversion direct-booking websites for service businesses—salons, wellness studios, clinics, trainers, chauffeurs, pet groomers, equipment/vehicle rentals, and more. Our sites focus on one thing: turning visitors into paid, deposit-secured appointments.",
    sections: ["home", "about"],
  },
  {
    id: 2,
    question: "How long does it take to launch?",
    answer:
      "Typical ranges: Solo (single calendar) 10–21 days, Team (multi-staff) 3–6 weeks, Multi-Location/Rental 6–10 weeks. Timelines include discovery, design, build, integrations, and QA. Rush options are available when content and decisions are ready on day one.",
    sections: ["home", "work"],
  },
  {
    id: 3,
    question: "How do your plans differ?",
    answer:
      "Solo: one bookable calendar and simple upsells. Team: multiple staff calendars, role-based access, Google/365 sync. Multi-Location: location routing, hours/policies per site. Rental/Fleet: inventory, blackout dates, holds/returns. Custom: bespoke features and integrations.",
    sections: ["work", "pricing", "home"],
  },
  {
    id: 4,
    question: "How do deposits, cancellations, and no-shows work?",
    answer:
      "Your site enforces your policy. We can collect non-refundable deposits or full prepayment, set cancellation windows, require card-on-file, charge late/no-show fees, and auto-send SMS/email reminders with links to reschedule inside your policy rules.",
    sections: ["home", "pricing", "contact"],
  },
  {
    id: 5,
    question: "Which payment processor do you use?",
    answer:
      "Stripe is our default for cards, Apple Pay, Google Pay, and subscription/membership billing. We can also integrate PayPal or regional options on request. You keep the merchant account and receive payouts directly.",
    sections: ["home", "pricing"],
  },
  {
    id: 6,
    question: "How is billing structured (setup fee and monthly)?",
    answer:
      "Most clients choose a one-time setup fee plus a monthly platform fee. You can either: (A) pay setup + first month at signup, renew on the 1st, or (B) pay setup + a prorated first month and then renew on the 1st. Annual prepay gets 20% off the monthly rate.",
    sections: ["pricing"],
  },
  {
    id: 7,
    question: "What’s included in the monthly fee?",
    answer:
      "Hosting, security updates, core feature updates, uptime monitoring, minor content tweaks, and support. Optional add-ons include growth experiments (A/B tests), SEO/content retainers, advanced dashboards, and custom feature work.",
    sections: ["pricing", "home"],
  },
  {
    id: 8,
    question: "Do SMS reminders cost extra?",
    answer:
      "Yes. SMS is billed at pass-through vendor rates (usage-based). We’ll estimate volumes during onboarding and set sensible limits so you control costs while keeping no-shows low.",
    sections: ["pricing"],
  },
  {
    id: 9,
    question:
      "Can you migrate me from Calendly, GlossGenius, Vagaro, Mindbody, or Square?",
    answer:
      "Yes. We migrate services, staff, locations, and—where exportable—clients and future bookings. We also set up redirects and ‘we’ve moved’ messaging to make the transition painless for your customers.",
    sections: ["contact", "work"],
  },
  {
    id: 10,
    question: "Will this replace my existing CRM or POS?",
    answer:
      "Often we complement them. We can push new leads/clients to your CRM, sync calendars (Google/365), and keep Stripe as your payments source of truth. If you need a full replacement, we’ll scope what’s realistic.",
    sections: ["contact", "about"],
  },
  {
    id: 11,
    question: "Do you support memberships, packages, and gift cards?",
    answer:
      "Yes—memberships with recurring billing, credit packs, punch cards, promo codes, and digital gift cards. Redemptions and balances are handled inside the booking flow.",
    sections: ["pricing", "home"],
  },
  {
    id: 12,
    question: "How do you handle multi-location and staff availability?",
    answer:
      "Rules per location (hours, buffers, services) and per staff (skills, breaks, travel time). Users pick location → provider → time, or we auto-assign by rules. Everything respects your blackout dates and real-time conflicts.",
    sections: ["work"],
  },
  {
    id: 13,
    question: "Can I upsell add-ons during booking?",
    answer:
      "Absolutely. We support one-click add-ons, bundles, and time-aware upsells that adjust service length and price. Cross-sells can appear on confirmation and reminder flows too.",
    sections: ["pricing", "work", "home"],
  },
  {
    id: 14,
    question: "What about rentals, fleets, or equipment scheduling?",
    answer:
      "We track inventory per asset, availability windows, prep/turnover time, holds/returns, deposits, and damages. Pricing can vary by day, duration, or season, with blackout logic for maintenance.",
    sections: ["work", "pricing"],
  },
  {
    id: 15,
    question: "What tech stack do you use?",
    answer:
      "Next.js for the front end, a Postgres database via Prisma, NextAuth for secure access, Stripe for payments, and best-in-class services for email/SMS and analytics. It’s fast, secure, and highly customizable.",
    sections: ["about", "work"],
  },
  {
    id: 16,
    question: "Where is my site hosted? Vercel or AWS?",
    answer:
      "By default we deploy on Vercel for speed and reliability. If you have specific requirements (VPC, regional data residency, enterprise SLAs), we can architect an AWS deployment as a custom engagement.",
    sections: ["about", "pricing"],
  },
  {
    id: 17,
    question: "Is the site fast and SEO-ready?",
    answer:
      "Yes. We build for Core Web Vitals with image optimization, code splitting, caching/CDN, and schema markup for services, reviews, and FAQs. We set up GA4 (or privacy-friendly analytics) and basic on-page SEO at launch.",
    sections: ["home", "blog"],
  },
  {
    id: 18,
    question: "Do you handle accessibility?",
    answer:
      "We design against WCAG 2.1 AA guidelines—color contrast, focus states, keyboard navigation, and semantic structure. Accessibility is an ongoing discipline; we include audits and fixes before launch.",
    sections: ["about", "work"],
  },
  {
    id: 19,
    question: "Is this HIPAA compliant for clinics/med-spas?",
    answer:
      "We’re not an EHR. We minimize PHI in the booking layer and integrate HIPAA-eligible vendors for intake forms and messaging when needed. For regulated workflows, we’ll scope compliant patterns with your counsel and vendors.",
    sections: ["about"],
  },
  {
    id: 20,
    question: "Who owns the content and data?",
    answer:
      "You own your brand, domain, copy, images, and customer/booking data. We license the platform code to you as part of your subscription. On request, we can export your data if you decide to move.",
    sections: ["about", "pricing"],
  },
  {
    id: 21,
    question: "What happens if I cancel?",
    answer:
      "We’ll schedule a clean wind-down, turn off renewals, and provide a data export (clients, bookings, products/services). If you need migration support or a static export, we can add that as a one-time service.",
    sections: ["contact", "pricing"],
  },
  {
    id: 22,
    question: "Can my team edit content without code?",
    answer:
      "Yes. You’ll get an admin with safe controls to manage services, pricing, staff schedules, blackout dates, policies, FAQs, promos, and blog posts. We also provide quick-reference docs and a training call.",
    sections: ["work", "contact"],
  },
  {
    id: 23,
    question: "Do you provide copywriting and photography?",
    answer:
      "We can. Many clients start with our conversion-ready defaults, then add on brand copy and photography to elevate the experience. We also offer guided prompts to move fast if you’re DIY-inclined.",
    sections: ["blog", "about"],
  },
  {
    id: 24,
    question: "Can you integrate reviews and UGC?",
    answer:
      "Yes—native testimonials, Google reviews pull-ins, and simple UGC uploads (with moderation) to showcase real results. We add schema so those reviews help search visibility.",
    sections: ["blog", "work"],
  },
  {
    id: 25,
    question: "Do you guarantee traffic or rankings?",
    answer:
      "We focus on conversion and retention—turning your existing attention into paid appointments. We’ll set a foundation for SEO and ads, but traffic volume depends on your market and marketing. We can run experiments to grow it.",
    sections: ["home", "blog"],
  },
  {
    id: 26,
    question: "Will you copy components from Webflow or Framer templates?",
    answer:
      "We reference patterns that work but build original, code-owned components tailored to your brand and flow. That keeps you fast, unique, and legally clean with full control over UX and performance.",
    sections: ["work", "about"],
  },
  {
    id: 27,
    question: "What analytics and dashboards do I get?",
    answer:
      "A bookings dashboard with revenue, utilization, no-show rate, channel attribution, and cohort retention. We wire GA4 (or Plausible/Matomo) and set up event tracking for funnel steps and conversions.",
    sections: ["work", "pricing"],
  },
  {
    id: 28,
    question: "Do you support multi-language or international customers?",
    answer:
      "Yes—language toggles, localized content, and time-zone-aware scheduling. If you serve multiple regions, we can vary services, pricing, and policies by locale.",
    sections: ["blog", "work"],
  },
  {
    id: 29,
    question: "How do refunds and disputes work?",
    answer:
      "Refunds follow your policy and are issued through Stripe. For disputes, we help assemble evidence (policy acceptance, reminder logs, visit history) to improve win rates.",
    sections: ["pricing", "contact"],
  },
  {
    id: 30,
    question: "What about emails and notifications?",
    answer:
      "We brand your transactional emails and SMS, including confirmations, reminders, reschedules, waitlist clears, membership renewals, and review requests. You control timing and tone.",
    sections: ["work", "contact"],
  },
  {
    id: 31,
    question: "Can you import my existing client list and future appointments?",
    answer:
      "Yes—CSV imports for clients and services are straightforward. Future bookings can usually be migrated if your current system supports export; we’ll map fields and validate before going live.",
    sections: ["work", "contact"],
  },
  {
    id: 32,
    question: "What security measures do you take?",
    answer:
      "End-to-end HTTPS, role-based access, regular dependency updates, WAF/CDN shielding, automated backups, and Stripe for PCI-scoped payments. We monitor uptime and errors continuously.",
    sections: ["work", "about"],
  },
  {
    id: 33,
    question: "Do you offer support after launch?",
    answer:
      "Definitely. You’ll have a dedicated support channel for fixes and small changes, plus options for ongoing experiments and new features. Most questions are answered same or next business day.",
    sections: ["about", "contact", "home"],
  },
  {
    id: 34,
    question: "Can I run promotions, discounts, and limited-time offers?",
    answer:
      "Yes—promo codes, first-visit offers, membership-only pricing, and time-boxed discounts. We can show urgency variables (spots left, timers) without harming UX.",
    sections: ["pricing"],
  },
  {
    id: 35,
    question: "What content do you need from me to start?",
    answer:
      "Brand assets (logo, colors, fonts), services and pricing, policies, hours, staff bios, location details, and any photos. If anything is missing, we’ll provide guided templates and fill gaps with best-practice defaults.",
    sections: ["contact", "work"],
  },
  {
    id: 36,
    question: "Do you work on contracts or month-to-month?",
    answer:
      "Most clients are month-to-month after setup. Annual prepay is available at a discount. Custom/enterprise builds may include specific statements of work and milestones.",
    sections: ["pricing", "about"],
  },
  {
    id: 37,
    question: "Can you add a blog or resources section?",
    answer:
      "Yes. We can ship a lightweight blog you can edit in the admin, or integrate a headless CMS if your team prefers. Posts include SEO schema and are optimized for speed.",
    sections: ["blog"],
  },
  {
    id: 38,
    question: "Do you handle email marketing and CRM automations?",
    answer:
      "We’ll integrate your tool of choice (Klaviyo, Mailchimp, HubSpot, etc.) and tag key events (lead, booking, no-show, renewal). If you need flows built, we can add that as a growth engagement.",
    sections: ["blog", "work"],
  },
  {
    id: 39,
    question: "Can I approve the design before development?",
    answer:
      "Yes. We work in short, visual sprints—wireframes to hi-fi mockups—so you can approve structure, copy, and style before we lock in and build.",
    sections: ["work", "about"],
  },
  {
    id: 40,
    question: "What makes Fonts & Footers different?",
    answer:
      "We’re laser-focused on bookings—not generic websites. Our flows are tested to reduce no-shows, capture deposits, and surface upsells without friction. You get speed to launch, measurable outcomes, and a partner who cares about filled calendars—not vanity metrics.",
    sections: ["about", "home"],
  },
] as const;
