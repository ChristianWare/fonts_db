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
