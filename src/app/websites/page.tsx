import WebsiteOutcomes from "@/components/WebsitesPage/WebsiteOutcomes/WebsiteOutcomes";
import WebsitesPageHero from "@/components/WebsitesPage/WebsitesPageHero/WebsitesPageHero";
import React from "react";

export default function WebsitesPage() {
  return (
    <main>
      <WebsitesPageHero />
      <WebsiteOutcomes />
    </main>
  );
}
