import Faq from "@/components/HomePage/Faq/Faq";
import PricingPreview from "@/components/HomePage/PricingPreview/PricingPreview";
import LeadsHowItWorks from "@/components/LeadsPage/LeadsHowItWorks/LeadsHowItWorks";
import LeadsProblem from "@/components/LeadsPage/LeadsProblem/LeadsProblem";
import Img1 from "../../../public/images/leads.jpg";
import PageIntroHero from "@/components/shared/PageIntroHero/PageIntroHero";
// import WhatsIncluded from "@/components/WebsitesPage/WhatsIncluded/WhatsIncluded";
import LeadsEmail from "@/components/LeadsPage/LeadsEmail/LeadsEmail";
import LeadsVsList from "@/components/LeadsPage/LeadsVsList/LeadsVsList";
import LeadsPreview from "@/components/LeadsPage/LeadsPreview/LeadsPreview";
import LeadExamples from "@/components/LeadsPage/LeadExamples/LeadExamples";
import ContactSection from "@/components/HomePage/ContactSection/ContactSection";

const heroItems = [
  {
    id: 1,
    feature: "Page speed",
    desc: "Core Web Vitals and mobile load times benchmarked against the operators you're competing with.",
  },
  {
    id: 2,
    feature: "Booking flow",
    desc: "Where prospects drop off — quote, payment, mobile friction, and account-required walls.",
  },
  {
    id: 3,
    feature: "Tech stack",
    desc: "Platform-specific risks flagged, with the fixes that actually move revenue.",
  },
  {
    id: 4,
    feature: "Brand & trust",
    desc: "Reviews, credentials, fleet imagery, and the conversion gaps costing you work.",
  },
];

export default function AuditPage() {
  return (
    <main>
      <PageIntroHero
        sectionIntroText='Free Website Audit'
        heading="Find out exactly what's costing you bookings in 60 seconds or less — for free."
        subheading='$0 · Detailed report sent to your inbox'
        items={heroItems}
        copy='The Fonts & Footers audit tool analyzes your website across the factors that determine whether you get found, whether visitors trust you, and whether your site actually converts. Free, instant results, with the full report sent straight to your inbox.'
      />
      <LeadsProblem />
      <LeadsHowItWorks />
      <LeadsPreview />
      <LeadExamples />
      <LeadsEmail />
      {/* <WhatsIncluded /> */}
      <LeadsVsList />
      <PricingPreview product='leads' />
      <Faq />
      <ContactSection />
    </main>
  );
}
