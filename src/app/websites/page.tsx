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
    </main>
  );
}
