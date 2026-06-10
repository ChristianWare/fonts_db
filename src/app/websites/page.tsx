import Faq from "@/components/HomePage/Faq/Faq";
import Features from "@/components/HomePage/Features/Features";
import HowItWorks from "@/components/HomePage/HowItWorks/HowItWorks";
import OtherDashboards from "@/components/HomePage/OtherDashboards/OtherDashboards";
import PricingPreview from "@/components/HomePage/PricingPreview/PricingPreview";
import ProjectSection from "@/components/HomePage/ProjectSection/ProjectSection";
import Img1 from "../../../public/images/website.jpg";
import PageIntroHero from "@/components/shared/PageIntroHero/PageIntroHero";
import WebsiteOutcomes from "@/components/WebsitesPage/WebsiteOutcomes/WebsiteOutcomes";
import NierExamples from "@/components/WebsitesPage/NierExamples/NierExamples";
import ContactSection from "@/components/HomePage/ContactSection/ContactSection";

const heroItems = [
  {
    id: 1,
    feature: "Direct booking engine",
    desc: "Multi-step, mobile-fast, no account required. Built so corporate clients actually finish the booking on the first visit.",
  },
  {
    id: 2,
    feature: "Admin dashboard",
    desc: "Bookings, payments, drivers, and reporting in one view. The operations system you have been faking with spreadsheets.",
  },
  {
    id: 3,
    feature: "Driver portal",
    desc: "Trip details, navigation, and push notifications. Dispatch handled without phone calls back to the office.",
  },
  {
    id: 4,
    feature: "Corporate accounts",
    desc: "Employee management and centralized billing for the accounts that book transportation as a relationship, not a transaction.",
  },
];

export default function WebsitesPage() {
  return (
    <main>
      <PageIntroHero
        src={Img1}
        sectionIntroText='Custom Built Website'
        heading='The platform that runs your whole black car business.'
        subheading='$499/month + $500 setup · Custom-built · Zero per-booking fees · Cancel anytime.'
        items={heroItems}
        copy='Built specifically for black car operators. Bookings, dispatch, payments, corporate accounts, and flight tracking — one platform, on your domain. No per-booking fees. No platform middlemen. Cancel anytime.'
        btnText='Book Discovery Call'
        href='/contact'
      />
      <OtherDashboards />
      <Features />
      <WebsiteOutcomes />
      <ProjectSection />
      <NierExamples />
      <PricingPreview product='website' />
      <HowItWorks />
      <Faq />
      <ContactSection />
    </main>
  );
}
