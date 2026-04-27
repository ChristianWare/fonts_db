/* eslint-disable @typescript-eslint/no-unused-vars */
import Img1 from "../../public/images/audit.jpg";
import Img2 from "../../public/images/leads.jpg";
// import Img3 from "../../public/images/website.jpg";
import Img4 from "../../public/images/system.jpg";
import Img5 from "../../public/images/chevy_corp.png";

import Img62 from "../../public/images/connected.jpg";
import LiveGoogleMaps from "../../public/images/WhyWeExist.jpg";
import PaymentProcessing from "../../public/images/WhyWeExist.jpg";
import FlightTracking from "../../public/images/WhyWeExist.jpg";
import Location from "@/components/shared/icons/Location/Location";
import Payment from "@/components/shared/icons/Payment/Payment";
import Plane from "@/components/shared/icons/Plane/Plane";
import Bell from "@/components/shared/icons/Bell/Bell";
import Business from "@/components/shared/icons/Business/Business";
import Analytics from "@/components/shared/icons/Analytics/Analytics";
import Driver from "@/components/shared/icons/Driver/Driver";
import Alert from "@/components/shared/Alert/Alert";
import Invoice from "@/components/shared/icons/Invoice/Invoice";
import Notifications from "@/components/shared/icons/Notifications/Notifications";
import Customer from "@/components/shared/icons/Customer/Customer";
import Hammer from "@/components/shared/icons/Hammer/Hammer";
import Target from "@/components/shared/icons/Target/Target";
import Lock from "@/components/shared/icons/Lock/Lock";

export const SolutionData = [
  {
    id: 1,
    oneWordDesc: "Step 1",
    title: "Run the free audit",
    src: Img1,
    description:
      "Find out exactly what your website is missing and where you stand against competitors in your market. Free, no email required, takes 60 seconds.",
    bullets: [
      "Google visibility score",
      "Mobile & speed check",
      "Conversion gap report",
      "Competitor comparison",
    ],
  },
  {
    id: 2,
    oneWordDesc: "Step 2",
    title: "Start finding leads",
    src: Img2,
    description:
      "While your website situation becomes clear, you start building your pipeline — reaching out to venues, hotels, and corporate clients. Every new account makes fixing your website more urgent.",
    bullets: [
      "Hot, warm & cold leads",
      "Verified contact info",
      "AI outreach scripts",
      "Built-in CRM",
    ],
  },
  {
    id: 3,
    oneWordDesc: "Step 3",
    title: "Launch your custom website",
    src: 2,
    description:
      "Now the system is complete. The audit identified the problems. The leads tool created urgency. The website closes the deals you're finding. Your business has a foundation it didn't have before — and it compounds from here.",
    bullets: [
      "Direct booking engine",
      "No per-booking fees",
      "Flight tracking included",
      "Driver & admin portal",
    ],
  },
] as const;

export const FocusFeatures = [
  {
    id: 1,
    title: "Black car buyers are a specific kind of buyer",
    desc: "A law firm booking executive transportation isn't the same buyer as a family ordering an Uber. The questions they ask, the trust signals they need, and the way they make decisions are completely different. Generic tools treat them the same anyway.",
    src: Img1,
  },
  {
    id: 2,
    title: "Wedding venues aren't booking ride-shares",
    desc: "A wedding venue selecting a preferred transportation vendor cares about reliability, professionalism, and consistency — not pricing per mile. The platforms that try to serve every industry can't speak that language.",
    src: Img1,
  },
  {
    id: 3,
    title: "Funeral homes need discretion, not transactions",
    desc: "Arranging transportation for a grieving family isn't a booking — it's a relationship that requires sensitivity, professionalism, and someone who understands the moment. That's not something generic software can deliver.",
    src: Img1,
  },
  {
    id: 4,
    title: "Generic platforms serve everyone equally poorly",
    desc: "The same tools point at airport shuttles, pet grooming services, and roofing companies. When your software is built to do everything for everyone, it does nothing exceptionally well for anyone.",
    src: Img1,
  },
  {
    id: 5,
    title: "Specialization shows up in the details",
    desc: "Flight tracking, corporate account billing, driver dispatch, airport meet-and-greet logistics — these aren't features you bolt onto a generic platform. They're features you only build correctly when this is the only industry you serve.",
    src: Img1,
  },
  {
    id: 6,
    title: "We chose depth over reach",
    desc: "Most agencies serve every vertical and go an inch deep on each one. We decided early on to go deep instead of wide — to understand black car so completely that every product we ship solves a real problem, not an assumed one.",
    src: Img1,
  },
  {
    id: 7,
    title: "That focus is why this works",
    desc: "Every detail in every product was built specifically for black car operators. The audit knows what good looks like for your industry. The lead tool knows where your accounts come from. The website platform knows how your business actually runs.",
    src: Img1,
  },
] as const;

export const featureData = [
  {
    title: "Your driver is never in the wrong place",
    desc: "Live routing pulls the exact route, distance, and drive time at booking. Flight tracking adjusts automatically if a flight is delayed — your driver arrives when the passenger does, not an hour before.",
    src: LiveGoogleMaps,
    icon: Location,
  },
  {
    title: "Payments that just work",
    desc: "All payments run through Stripe. Collect deposits at booking, send balance links after the ride, store cards for repeat clients — everything on your schedule, nothing chased manually.",
    src: PaymentProcessing,
    icon: Payment,
  },
  {
    title: "Flights tracked. Drivers adjusted.",
    desc: "Customers enter their flight number once. The platform watches it from there — if it's delayed, the booking reflects it automatically. No calls, no recalculating, no driver waiting an hour early.",
    src: FlightTracking,
    icon: Plane,
  },
  {
    title: "Clients book in under two minutes",
    desc: "No account required to book. Customers get through the flow fast, on any device — and if they want to save their details for next time, they can. Never forced.",
    src: Img1,
    icon: Bell,
  },
  {
    title: "Corporate clients sign themselves up",
    desc: "Business clients apply for a corporate account directly through your platform. Once approved, they get centralized billing and employee management — the kind of setup that makes companies stick around.",
    src: Img1,
    icon: Business,
  },
  {
    title: "Your entire operation in one screen",
    desc: "Bookings, drivers, payments, customers, and reports all live in one dashboard. No spreadsheets, no jumping between apps, nothing falling through because two systems don't talk.",
    src: Img1,
    icon: Analytics,
  },
  {
    title: "Drivers always know what's next",
    desc: "Every driver gets their own portal with their full schedule, passenger details, and real-time updates — straight to their phone. No calls to relay trip info. No confusion about which job is theirs.",
    src: Img1,
    icon: Driver,
  },
  {
    title: "An experience worth coming back to",
    desc: "Every rider gets a branded customer portal — upcoming trips, past receipts, saved addresses. It runs under your name, not ours. The kind of experience that turns a one-time booking into a regular client.",
    src: Img1,
    icon: Customer,
  },
  {
    title: "No calls to dispatch a driver",
    desc: "New assignments, updates, and cancellations go straight to the driver's phone as push notifications. The platform handles the communication — you handle the business.",
    src: Img1,
    icon: Notifications,
  },
  {
    title: "Nothing important gets buried",
    desc: "The moment you log in, the dashboard flags what needs attention — outstanding balances, unassigned drivers, stuck bookings, recent tips. You see what matters first, every time.",
    src: Img1,
    icon: Alert,
  },
  {
    title: "Invoices sent without lifting a finger",
    desc: "Professional PDF invoices generate automatically for every completed booking. Corporate clients download them directly from their portal — nothing manual required on your end.",
    src: Img1,
    icon: Invoice,
  },
] as const;

export const approachData = [
  {
    title: "Built in public, not in theory",
    desc: "Barry La Nier of Nier Transportation in Phoenix was the first operator to deploy the platform. His site went live, took real bookings, and exposed every gap in the product. Everything here was refined against a real operation — not a prototype, not a demo environment.",
    // src: BuiltInPublic,
    icon: Hammer,
  },
  {
    title: "One industry, full depth",
    desc: "Most agencies serve every vertical and go an inch deep on each one. Fonts & Footers serves black car and limo operators only. The audit knows what a good black car website looks like. The lead tool knows where corporate accounts come from. The website platform knows how this business actually runs.",
    // src: OneIndustry,
    icon: Target,
  },
  {
    title: "You own everything",
    desc: "Your brand, your domain, your customer data, your booking history. We never put our name on your platform. Your clients will never see ours. If you ever leave, you take everything with you — full data export, no friction.",
    // src: YouOwn,
    icon: Lock,
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
  // HOME PAGE QUESTIONS
  {
    id: 1,
    question: "Do I have to use all three products?",
    answer:
      "No. Each product works independently. Most operators start with the free audit — it takes 60 seconds and costs nothing. From there you can add the lead tool, the website, or both in whatever order makes sense for where your business is right now.",
    sections: ["home"],
  },
  {
    id: 2,
    question: "What does the free audit actually show me?",
    answer:
      "It analyzes your website across the key factors that determine whether you get found on Google, whether visitors trust you enough to book, and whether your site is technically healthy. You get a score and a specific breakdown of what to fix. No email required, no signup, under 60 seconds.",
    sections: ["home"],
  },
  {
    id: 3,
    question: "What kind of leads does the lead tool find?",
    answer:
      "Three types. Hot leads are people actively requesting transportation right now — in Facebook groups, on Nextdoor, and through event listings with public contact info. Warm leads are businesses showing signals of upcoming transportation need. Cold leads are the B2B accounts that generate consistent recurring demand — wedding venues, hotels, law firms, funeral homes, event planners, and more. Every lead includes the specific contact person and verified contact info when available.",
    sections: ["home"],
  },
  {
    id: 4,
    question: "Do multiple operators in the same city see the same leads?",
    answer:
      "Yes — the lead database is shared. This works because you're targeting businesses, not individuals. A wedding venue can have relationships with multiple transportation vendors. The operator who wins the account is the one who reaches out first and follows up best — not whoever got an exclusive lead.",
    sections: ["home"],
  },
  {
    id: 5,
    question: "How much does the lead tool cost?",
    answer:
      "$125 per month, full access, no credits, no tiers. Every lead category, every market feature, AI outreach scripts, and the built-in CRM are all included. There's a free 7-day trial with no credit card required so you can see real leads in your market before you commit.",
    sections: ["home"],
  },
  {
    id: 6,
    question: "How is the website priced?",
    answer:
      "$499 per month flat. No setup fee, no per-booking fees, no per-driver fees. Design, development, hosting, booking engine, admin dashboard, driver portal, flight tracking, payment processing, and ongoing support are all included. One number, everything covered.",
    sections: ["home"],
  },
  {
    id: 7,
    question: "How long does it take to launch the website?",
    answer:
      "Most clients are live within 2 to 3 weeks. The platform is already built and running with real operators — we're configuring it to your company, not starting from scratch.",
    sections: ["home"],
  },
  {
    id: 8,
    question: "Do I own my website and customer data?",
    answer:
      "Yes — completely. Your brand, your domain, your customer relationships, and your booking data belong to you. We never put our name on your platform and your clients will never see the Fonts & Footers name. If you ever decide to leave, we provide a full data export.",
    sections: ["home"],
  },
  {
    id: 9,
    question: "What kind of support do I get?",
    answer:
      "Direct access to Chris — the person who built the platform. Not a ticket system, not a support team. Most issues get resolved same day. New features added to the platform are included in your monthly rate at no extra charge.",
    sections: ["home"],
  },
  {
    id: 10,
    question: "Where do I start?",
    answer:
      "Run the free audit. It takes 60 seconds, requires no email, and shows you exactly where your website stands right now. Most operators start there and the next steps become obvious from what they find.",
    sections: ["home"],
  },

  // ABOUT PAGE QUESTIONS
  {
    id: 11,
    question: "Who is behind Fonts & Footers?",
    answer:
      "Chris Ware — the developer who built every product on the platform. Not a team, not a sales staff, not a support layer between you and the person doing the work. When you book a call, talk to support, or get a feature shipped, you're working directly with Chris.",
    sections: ["about"],
  },
  {
    id: 12,
    question: "Why only black car and limo operators?",
    answer:
      "Because going deep beats going wide. Most agencies serve every industry and go an inch deep on each one. We chose to understand black car so completely that every product solves a real problem operators are actually having — not a problem we assumed they had. That focus is the difference you feel from the first product you use.",
    sections: ["about"],
  },
  {
    id: 13,
    question: "Where is Fonts & Footers based?",
    answer:
      "Phoenix, Arizona. The first deployed client — Nier Transportation — is also based in Phoenix. That said, the platform works for black car operators across the US. The audit tool, lead tool, and website platform all work regardless of your location.",
    sections: ["about"],
  },
  {
    id: 14,
    question: "How do I know the products actually work?",
    answer:
      "Because they're already running with a real operator. Barry La Nier of Nier Transportation in Phoenix was the first deployment. His site is live, taking direct bookings, and operating without per-booking fees. Every product was refined against his operation before it shipped to anyone else.",
    sections: ["about"],
  },
  {
    id: 15,
    question: "What's the long-term vision?",
    answer:
      "To build the operating system black car operators actually need — every tool, every integration, every workflow built specifically for how this industry works. The three products available today are the foundation. More is coming, all built on the same principle: deep specialization, refined with real operators.",
    sections: ["about"],
  },
  {
    id: 16,
    question: "Are you open to partnerships or referrals?",
    answer:
      "Yes. If you work with black car operators in any capacity — software, insurance, fleet management, marketing — and there's a way our products complement what you offer, reach out. The industry is small enough that aligned partnerships create real value for everyone involved.",
    sections: ["about"],
  },
] as const;