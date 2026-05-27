import AboutPageProject from "@/components/AboutPage/AboutPageProject/AboutPageProject";
import Faq from "@/components/HomePage/Faq/Faq";
import HowItWorks from "@/components/HomePage/HowItWorks/HowItWorks";
import PricingPreview from "@/components/HomePage/PricingPreview/PricingPreview";
import Cursor from "@/components/shared/icons/Cursor/Cursor";
import PageIntroHero from "@/components/shared/PageIntroHero/PageIntroHero";
import WebsiteOutcomes from "@/components/WebsitesPage/WebsiteOutcomes/WebsiteOutcomes";
import WhatsIncluded from "@/components/WebsitesPage/WhatsIncluded/WhatsIncluded";

export default function WebsitesPage() {
  return (
    <main>
      <PageIntroHero
        icon={<Cursor />}
        sectionIntroText='Product 03 of 03'
        heading='A website that closes the deal'
        headingAccent='after you make the call'
        subheading='$499/month · Everything included · No setup fee · Cancel anytime'
        copy="We didn't build a generic tool and point it at the transportation industry. Every product was built from the ground up for black car operators specifically — the way you work, the clients you chase, and the problems you actually face. Each one works on its own, but they're designed to work together."
      />
      <WebsiteOutcomes />
      <WhatsIncluded />
      <PricingPreview />
      <HowItWorks />
      <AboutPageProject />
      <Faq />
    </main>
  );
}
