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

export default function WebsitesPage() {
  return (
    <main>
      <PageIntroHero
        src={Img1}
        sectionIntroText='Custom Built Website'
        heading='A custom website that closes the deal'
        headingAccent='after you make the call'
        subheading='$499/month · Everything included · No setup fee · Cancel anytime'
        copy="We didn't build a generic tool and point it at the transportation industry. Every product was built from the ground up for black car operators specifically — the way you work, the clients you chase, and the problems you actually face. Each one works on its own, but they're designed to work together."
      />
      <OtherDashboards />
      <Features />
      <WebsiteOutcomes />
      <ProjectSection />
      <NierExamples />
      <PricingPreview product='website' />
      <HowItWorks />
      <Faq />
    </main>
  );
}
