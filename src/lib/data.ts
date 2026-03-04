import Img1 from "../../public/images/branded.jpg";
import Img2 from "../../public/images/WhyWeExist.jpg";
import Img3 from "../../public/images/operation.jpg";
import Img4 from "../../public/images/everyRole.jpg";
import Img5 from "../../public/images/earnings.jpg";

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
