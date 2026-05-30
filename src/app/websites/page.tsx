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

export default function WebsitesPage() {
  return (
    <main>
      <PageIntroHero
        src={Img1}
        sectionIntroText='Custom Built Website'
        heading='A custom website that closes the deal'
        headingAccent=''
        subheading='$499/month · Everything included · No setup fee · Cancel anytime'
        copy='We build custom websites that are designed to convert visitors into customers. Our websites are built with the latest technology and are optimized for speed, SEO, and user experience. We also provide ongoing support and maintenance to ensure your website is always up-to-date and performing at its best.'
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
