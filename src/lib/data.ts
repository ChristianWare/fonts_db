/* eslint-disable @typescript-eslint/no-unused-vars */
import Img1 from "../../public/images/audit.jpg";
import Img2 from "../../public/images/leads.jpg";
// import Img3 from "../../public/images/website.jpg";
import Img4 from "../../public/images/system.jpg";
import Img5 from "../../public/images/chevy_corp.png";

import Img62 from "../../public/images/connected.jpg";
import LiveGoogleMaps from "../../public/images/liveGoogleMaps.png";
import PaymentProcessing from "../../public/images/paymentProcessesing.png";
import FlightTracking from "../../public/images/flightTracking.png";
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

// export const DashboardFeatures = [
//   {
//     id: 1,
//     title: "Every booking, fully visible",
//     desc: "Route, vehicle, passenger info, flight data, pricing, and payment status — all in one place the moment a booking comes in. Approve, edit, assign, and update without touching another app.",
//     src: Img6,
//   },
//   {
//     id: 2,
//     title: "Price and confirm in one move",
//     desc: "New bookings land as pending. Review the details, set the final price — calculated automatically from distance, vehicle, and your rates — then confirm to the rider. All from one screen, no back and forth.",
//     src: Img7,
//   },
//   {
//     id: 3,
//     title: "No more chasing payments",
//     desc: "Collect deposits at booking, send balance links when the ride is done, track outstanding balances, issue refunds — everything in one place. You always know exactly where every dollar stands.",
//     src: Img8,
//   },
//   {
//     id: 4,
//     title: "Assign a driver in seconds",
//     desc: "Pick from your available roster, and the driver gets an automatic notification with full trip details. The dashboard flags conflicts — you'll never accidentally double-book a driver.",
//     src: Img9,
//   },
//   {
//     id: 5,
//     title: "The important stuff surfaces itself",
//     desc: "Outstanding balances, upcoming trips without a driver, bookings stuck in review, recent tips — all flagged automatically on your home screen. You see what needs attention first, every time you log in.",
//     src: Img10,
//   },
//   {
//     id: 6,
//     title: "Every client relationship in one place",
//     desc: "A full directory of everyone who has ever booked with you — contact info, booking history, total spend, account type. Individual clients, corporate accounts, and guest bookers all organized and searchable.",
//     src: Img11,
//   },
//   {
//     id: 7,
//     title: "Know exactly how your business is performing",
//     desc: "Revenue by date range, bookings by service type, driver performance, top clients by spend. Export for accounting or use the built-in charts to spot what's working and what isn't.",
//     src: Img12,
//   },
//   {
//     id: 8,
//     title: "Change anything. No developer needed.",
//     desc: "Update your logo, service area, pricing, email details, or notification preferences from a single settings panel — whenever you need to. Your platform stays current without a support ticket.",
//     src: Img13,
//   },
// ] as const;

// export const featureData = [
//   {
//     title: "Your driver is never in the wrong place",
//     desc: "Live routing pulls the exact route, distance, and drive time at booking. Flight tracking adjusts automatically if a flight is delayed — your driver arrives when the passenger does, not an hour before.",
//     src: LiveGoogleMaps,
//     icon: Location,
//   },
//   {
//     title: "Payments that just work",
//     desc: "All payments run through Stripe. Collect deposits at booking, send balance links after the ride, store cards for repeat clients — everything on your schedule, nothing chased manually.",
//     src: PaymentProcessing,
//     icon: Payment,
//   },
//   {
//     title: "Flights tracked. Drivers adjusted.",
//     desc: "Customers enter their flight number once. The platform watches it from there — if it's delayed, the booking reflects it automatically. No calls, no recalculating, no driver waiting an hour early.",
//     src: FlightTracking,
//     icon: Plane,
//   },
//   {
//     title: "Clients book in under two minutes",
//     desc: "No account required to book. Customers get through the flow fast, on any device — and if they want to save their details for next time, they can. Never forced.",
//     src: Img9,
//     icon: Bell,
//   },
//   {
//     title: "Corporate clients sign themselves up",
//     desc: "Business clients apply for a corporate account directly through your platform. Once approved, they get centralized billing and employee management — the kind of setup that makes companies stick around.",
//     src: Img10,
//     icon: Business,
//   },
//   {
//     title: "Your entire operation in one screen",
//     desc: "Bookings, drivers, payments, customers, and reports all live in one dashboard. No spreadsheets, no jumping between apps, nothing falling through because two systems don't talk.",
//     src: Img11,
//     icon: Analytics,
//   },
//   {
//     title: "Drivers always know what's next",
//     desc: "Every driver gets their own portal with their full schedule, passenger details, and real-time updates — straight to their phone. No calls to relay trip info. No confusion about which job is theirs.",
//     src: Img12,
//     icon: Driver,
//   },
//   {
//     title: "An experience worth coming back to",
//     desc: "Every rider gets a branded customer portal — upcoming trips, past receipts, saved addresses. It runs under your name, not ours. The kind of experience that turns a one-time booking into a regular client.",
//     src: Img13,
//     icon: Customer,
//   },
//   {
//     title: "No calls to dispatch a driver",
//     desc: "New assignments, updates, and cancellations go straight to the driver's phone as push notifications. The platform handles the communication — you handle the business.",
//     src: Img13,
//     icon: Notifications,
//   },
//   {
//     title: "Nothing important gets buried",
//     desc: "The moment you log in, the dashboard flags what needs attention — outstanding balances, unassigned drivers, stuck bookings, recent tips. You see what matters first, every time.",
//     src: Img13,
//     icon: Alert,
//   },
//   {
//     title: "Invoices sent without lifting a finger",
//     desc: "Professional PDF invoices generate automatically for every completed booking. Corporate clients download them directly from their portal — nothing manual required on your end.",
//     src: Img13,
//     icon: Invoice,
//   },
// ] as const;

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
] as const;
