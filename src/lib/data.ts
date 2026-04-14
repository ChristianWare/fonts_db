/* eslint-disable @typescript-eslint/no-unused-vars */
import Img1 from "../../public/images/audit.jpg";
import Img2 from "../../public/images/leads.jpg";
import Img3 from "../../public/images/website.jpg";
import Img4 from "../../public/images/system.jpg";
import Img5 from "../../public/images/chevy_corp.png";

import Img62 from "../../public/images/connected.jpg";
import Img6 from "../../public/dashboard/bookings.png";
import Img7 from "../../public/dashboard/approve.png";
import Img8 from "../../public/dashboard/pricing.png";
import Img9 from "../../public/dashboard/driver.png";
import Img10 from "../../public/dashboard/alerts.png";
import Img11 from "../../public/dashboard/customers.png";
import Img12 from "../../public/dashboard/reports.png";
import Img13 from "../../public/dashboard/settings.png";
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
    src: Img3,
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

export const DashboardFeatures = [
  {
    id: 1,
    title: "Every booking, fully visible",
    desc: "Route, vehicle, passenger info, flight data, pricing, and payment status — all in one place the moment a booking comes in. Approve, edit, assign, and update without touching another app.",
    src: Img6,
  },
  {
    id: 2,
    title: "Price and confirm in one move",
    desc: "New bookings land as pending. Review the details, set the final price — calculated automatically from distance, vehicle, and your rates — then confirm to the rider. All from one screen, no back and forth.",
    src: Img7,
  },
  {
    id: 3,
    title: "No more chasing payments",
    desc: "Collect deposits at booking, send balance links when the ride is done, track outstanding balances, issue refunds — everything in one place. You always know exactly where every dollar stands.",
    src: Img8,
  },
  {
    id: 4,
    title: "Assign a driver in seconds",
    desc: "Pick from your available roster, and the driver gets an automatic notification with full trip details. The dashboard flags conflicts — you'll never accidentally double-book a driver.",
    src: Img9,
  },
  {
    id: 5,
    title: "The important stuff surfaces itself",
    desc: "Outstanding balances, upcoming trips without a driver, bookings stuck in review, recent tips — all flagged automatically on your home screen. You see what needs attention first, every time you log in.",
    src: Img10,
  },
  {
    id: 6,
    title: "Every client relationship in one place",
    desc: "A full directory of everyone who has ever booked with you — contact info, booking history, total spend, account type. Individual clients, corporate accounts, and guest bookers all organized and searchable.",
    src: Img11,
  },
  {
    id: 7,
    title: "Know exactly how your business is performing",
    desc: "Revenue by date range, bookings by service type, driver performance, top clients by spend. Export for accounting or use the built-in charts to spot what's working and what isn't.",
    src: Img12,
  },
  {
    id: 8,
    title: "Change anything. No developer needed.",
    desc: "Update your logo, service area, pricing, email details, or notification preferences from a single settings panel — whenever you need to. Your platform stays current without a support ticket.",
    src: Img13,
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
    src: Img9,
    icon: Bell,
  },
  {
    title: "Corporate clients sign themselves up",
    desc: "Business clients apply for a corporate account directly through your platform. Once approved, they get centralized billing and employee management — the kind of setup that makes companies stick around.",
    src: Img10,
    icon: Business,
  },
  {
    title: "Your entire operation in one screen",
    desc: "Bookings, drivers, payments, customers, and reports all live in one dashboard. No spreadsheets, no jumping between apps, nothing falling through because two systems don't talk.",
    src: Img11,
    icon: Analytics,
  },
  {
    title: "Drivers always know what's next",
    desc: "Every driver gets their own portal with their full schedule, passenger details, and real-time updates — straight to their phone. No calls to relay trip info. No confusion about which job is theirs.",
    src: Img12,
    icon: Driver,
  },
  {
    title: "An experience worth coming back to",
    desc: "Every rider gets a branded customer portal — upcoming trips, past receipts, saved addresses. It runs under your name, not ours. The kind of experience that turns a one-time booking into a regular client.",
    src: Img13,
    icon: Customer,
  },
  {
    title: "No calls to dispatch a driver",
    desc: "New assignments, updates, and cancellations go straight to the driver's phone as push notifications. The platform handles the communication — you handle the business.",
    src: Img13,
    icon: Notifications,
  },
  {
    title: "Nothing important gets buried",
    desc: "The moment you log in, the dashboard flags what needs attention — outstanding balances, unassigned drivers, stuck bookings, recent tips. You see what matters first, every time.",
    src: Img13,
    icon: Alert,
  },
  {
    title: "Invoices sent without lifting a finger",
    desc: "Professional PDF invoices generate automatically for every completed booking. Corporate clients download them directly from their portal — nothing manual required on your end.",
    src: Img13,
    icon: Invoice,
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
      "We build fully custom direct booking websites and white-label booking platforms exclusively for black car and limousine companies. Every platform includes a branded booking engine, admin dashboard, driver portal, customer portal, corporate account management, flight tracking, and Stripe payment processing — all under your brand, on your domain. We build for one industry and one industry only.",
    sections: ["home", "about"],
  },
  {
    id: 2,
    question: "How is pricing structured?",
    answer:
      "One-time setup fee of $500, then $499 per month flat. No per-booking fees, no per-driver fees, no seat-based pricing, and no upgrade fees as we add new features. Operators who come on board now lock in the $499 rate for life — this is our founding client rate and it will increase for future clients as the platform grows.",
    sections: ["pricing", "home"],
  },
  {
    id: 3,
    question: "How long does it take to launch?",
    answer:
      "Most clients are live within 2 to 3 weeks. Week one is the discovery call and build. Week two is configuration and your review. Week three is final refinements and launch. We move fast because the platform is already built and battle-tested — we're configuring it to your operation, not starting from scratch.",
    sections: ["home", "work"],
  },
  {
    id: 4,
    question: "Do I own my website and customer data?",
    answer:
      "Yes — completely. Your brand, your domain, your customer relationships, and your booking data belong to you. We never put our name on your platform and your clients will never see the Fonts & Footers name. If you ever decide to leave, we'll provide a full data export. You built your customer base — it stays yours.",
    sections: ["about", "pricing"],
  },
  {
    id: 5,
    question: "Will this work for my specific operation?",
    answer:
      "If you run a black car or limo company, yes. The platform is built around how transportation operators actually work — multiple vehicle types, service areas, hourly and point-to-point pricing, driver dispatch, corporate accounts, and airport transfers with live flight tracking. We configure everything around your services, your vehicles, and your pricing structure.",
    sections: ["home", "work"],
  },
  {
    id: 6,
    question: "What happens to my existing bookings and customers?",
    answer:
      "We handle the transition. If your current platform allows data export, we migrate your customer list and any future bookings before you go live. We also help you communicate the switch to your existing clients so the experience stays seamless on their end.",
    sections: ["work", "contact"],
  },
  {
    id: 7,
    question: "How do payments work?",
    answer:
      "All payments run through Stripe — the most trusted payment processor in the industry. You keep your own Stripe merchant account and receive payouts directly. We support deposits, full prepayment, balance collection, tips, refunds, and card-on-file for repeat customers. Corporate accounts get centralized billing with invoices generated automatically.",
    sections: ["pricing", "home"],
  },
  {
    id: 8,
    question: "What does the driver portal include?",
    answer:
      "Every driver on your roster gets their own dedicated portal with their full trip schedule, passenger details, pickup and drop-off information, and real-time status updates. It installs like a native app on their phone — no App Store download required. Push notifications fire automatically for new assignments, updates, and cancellations.",
    sections: ["work"],
  },
  {
    id: 9,
    question: "What if I already have a website?",
    answer:
      "We replace it entirely with something built specifically for how black car operators work and how their clients book. Most existing transportation websites weren't designed with a booking engine at their core — they're brochure sites with a form or a third-party widget bolted on. We build the booking experience as the foundation, not an afterthought.",
    sections: ["home", "contact"],
  },
  {
    id: 10,
    question: "What kind of support do I get after launch?",
    answer:
      "Ongoing support is included in your monthly subscription. You'll have a direct line for questions, fixes, and small updates. Most issues are resolved same or next business day. As we ship new features to the platform, they're added to your site automatically at no extra charge — your $499 rate covers everything we build going forward.",
    sections: ["about", "contact", "home"],
  },
] as const;
