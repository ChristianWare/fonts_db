import AboutPageProject from "@/components/AboutPage/AboutPageProject/AboutPageProject";
import Faq from "@/components/HomePage/Faq/Faq";
import HowItWorks from "@/components/HomePage/HowItWorks/HowItWorks";
import PricingPreview from "@/components/HomePage/PricingPreview/PricingPreview";
import WebsiteOutcomes from "@/components/WebsitesPage/WebsiteOutcomes/WebsiteOutcomes";
import WebsitesPageHero from "@/components/WebsitesPage/WebsitesPageHero/WebsitesPageHero";
import WhatsIncluded from "@/components/WebsitesPage/WhatsIncluded/WhatsIncluded";
import React from "react";

export default function WebsitesPage() {
  return (
    <main>
      <WebsitesPageHero />
      <WebsiteOutcomes />
      <WhatsIncluded />
      <PricingPreview />
      <HowItWorks />
      <AboutPageProject />
      <Faq />
    </main>
  );
}
