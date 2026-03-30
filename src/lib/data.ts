import Img1 from "../../public/images/reliefii.jpg";
import Img2 from "../../public/images/work.jpg";
import Img3 from "../../public/images/proven.jpg";
import Img4 from "../../public/images/system.jpg";
import Img5 from "../../public/images/earningsii.jpg";

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
    oneWordDesc: "Flat",
    title: "One flat rate. No cuts, ever.",
    src: Img1,
    description:
      "Flat $499/month. No per-booking fees, no percentage taken, no surprises — no matter how many rides you run.",
    bullets: [
      "Flat monthly rate",
      "Zero per-booking fees",
      "No surprises",
      "Keep every dollar",
    ],
  },
  {
    id: 2,
    oneWordDesc: "Branded",
    title: "Your name on everything",
    src: Img2,
    description:
      "Your platform runs on your domain, in your colors, under your brand — clients never see a third-party name anywhere.",
    bullets: ["Your domain", "Your colors", "Your emails", "Your brand"],
  },
  {
    id: 3,
    oneWordDesc: "Yours",
    title: "Your customers. Your data.",
    src: Img3,
    description:
      "Every booking, every client record, every relationship lives in your platform — owned by you, accessible to you, always.",
    bullets: [
      "Full data ownership",
      "Direct client access",
      "Built-in CRM",
      "No middleman",
    ],
  },
  {
    id: 4,
    oneWordDesc: "Controlled",
    title: "You set the rules",
    src: Img4,
    description:
      "Your pricing, your policies, your platform. Nothing changes unless you change it — no algorithm updates, no policy surprises.",
    bullets: ["Your pricing", "Your policies", "No surprises", "Full control"],
  },
  {
    id: 5,
    oneWordDesc: "Premium",
    title: "A first impression that closes deals",
    src: Img5,
    description:
      "A fully custom site signals a premium operation before a client ever books — built specifically for black car, not adapted from a template.",
    bullets: [
      "Custom design",
      "Premium feel",
      "Built for black car",
      "Wins corporate clients",
    ],
  },
  {
    id: 6,
    oneWordDesc: "Connected",
    title: "One platform. Every role.",
    src: Img62,
    description:
      "Bookings, drivers, payments, and corporate accounts all run from a single system — fully connected, nothing falling through the cracks.",
    bullets: ["One dashboard", "Every role", "Zero gaps", "Fully connected"],
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
    src: LiveGoogleMaps,
    icon: Location,
  },
  {
    title: "Payment Processing",
    desc: "All payments run through Stripe — secure, reliable, and familiar to your clients. Accept cards at booking, store payment methods for repeat customers, and collect deposits or full balances on your schedule.",
    src: PaymentProcessing,
    icon: Payment,
  },
  {
    title: "Flight Tracking",
    desc: "Customers enter their flight number at booking and the platform pulls live aviation data automatically. If a flight is delayed, the booking reflects it — your driver arrives when the passenger does, not an hour before.",
    src: FlightTracking,
    icon: Plane,
  },
  {
    title: "Guest Checkout",
    desc: "Customers can book a ride without creating an account — no friction, no barriers. If they want to save their details for next time, account creation is always available but never required.",
    src: Img9,
    icon: Bell,
  },
  // {
  //   title: "Gratuity",
  //   desc: "Tip selection is built directly into the checkout flow, so customers can add a gratuity before they even get in the car. Tips are tracked per driver and visible in your admin dashboard.",
  // },
  // {
  //   title: "Deposits",
  //   desc: "Collect a deposit at booking and send a balance payment link when the trip is complete. You control the deposit amount per service type — giving you flexibility without chasing payments after the fact.",
  // },
  // {
  //   title: "Confirmation Emails",
  //   desc: "Every booking triggers a branded confirmation email with full trip details, receipt, and a link to the customer portal. Your clients get exactly what they need, automatically, the moment they book.",
  // },
  {
    title: "Corporate Accounts",
    desc: "Business clients can apply for a corporate account directly through your platform. Once approved, they get centralized billing, employee management, and a dedicated booking experience built for business travel.",
    src: Img10,
    icon: Business,
  },
  {
    title: "Admin Dashboard",
    desc: "Your entire operation lives in one place — bookings, drivers, payments, customers, and reports all managed from a single screen. No spreadsheets, no separate apps, no information falling through the cracks.",
    src: Img11,
    icon: Analytics,
  },
  {
    title: "Driver Portal",
    desc: "Every driver on your roster gets their own dedicated portal with their full trip schedule, passenger details, and real-time status updates. It installs like a native app on their phone — no App Store download required.",
    src: Img12,
    icon: Driver,
  },
  {
    title: "Customer Portal",
    desc: "Every rider gets access to a personal portal where they can view upcoming and past trips, download receipts, and save frequently used addresses. It's branded entirely to your company — your clients never see our name.",
    src: Img13,
    icon: Customer,
  },
  {
    title: "Push Notifications",
    desc: "Drivers receive instant push notifications for new assignments, booking updates, and cancellations. No more phone calls to relay trip details — the platform handles it automatically.",
    src: Img13,
    icon: Notifications,
  },
  {
    title: "Smart Alerts",
    desc: "The dashboard home screen surfaces what needs your attention the moment you log in. Outstanding balances, unassigned drivers, stuck bookings, and recent tips are all flagged automatically so nothing gets missed.",
    src: Img13,
    icon: Alert,
  },
  // {
  //   title: "SEO",
  //   desc: "The platform auto-generates 640+ location and service pages targeting every city and service type in your market. Someone searching for black car service in your area finds you — not a directory or a competitor.",
  // },
  {
    title: "Invoice Generation",
    desc: "Professional PDF invoices are generated automatically for every completed booking. Corporate clients can download invoices directly from their portal — no manual work required on your end.",
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
