import Faq from "@/components/HomePage/Faq/Faq";
import PricingPreview from "@/components/HomePage/PricingPreview/PricingPreview";
import LeadsHowItWorks from "@/components/LeadsPage/LeadsHowItWorks/LeadsHowItWorks";
import LeadsProblem from "@/components/LeadsPage/LeadsProblem/LeadsProblem";
import Img1 from "../../../public/images/leads.jpg";
import PageIntroHero from "@/components/shared/PageIntroHero/PageIntroHero";
import LeadsEmail from "@/components/LeadsPage/LeadsEmail/LeadsEmail";
import LeadsVsList from "@/components/LeadsPage/LeadsVsList/LeadsVsList";
import LeadsPreview from "@/components/LeadsPage/LeadsPreview/LeadsPreview";
import LeadExamples from "@/components/LeadsPage/LeadExamples/LeadExamples";
import ContactSection from "@/components/HomePage/ContactSection/ContactSection";

const heroItems = [
  {
    id: 1,
    feature: "Hot leads",
    desc: "Events in your market happening in the next two weeks. Call them today, win the transportation.",
  },
  {
    id: 2,
    feature: "Warm leads",
    desc: "Events two weeks to three months out. Time to build the relationship before they need the ride.",
  },
  {
    id: 3,
    feature: "Cold leads",
    desc: "B2B accounts across nine categories — wedding venues, hotels, casinos, and the prospects that fill calendars for years.",
  },
  {
    id: 4,
    feature: "Every morning",
    desc: "One inbox digest with the highest-scoring prospects across all three tiers. No login required to see your day.",
  },
];

export default function LeadsPage() {
  return (
    <main>
      <PageIntroHero
        src={Img1}
        sectionIntroText='Leads Tool'
        heading='Find your next client before your competition does.'
        subheading='Three lead temperatures, delivered to your inbox every morning. Every lead scored, briefed, and paired with a ready-to-send outreach script.'
        items={heroItems}
        copy='$125/month flat. 7-day free trial. Hot, warm, and cold leads in one inbox. No per-lead fees. Cancel anytime.'
      />
      <LeadsProblem />
      <LeadsHowItWorks />
      <LeadsPreview />
      <LeadExamples />
      <LeadsEmail />
      <LeadsVsList />
      <PricingPreview product='leads' />
      <Faq />
      <ContactSection />
    </main>
  );
}
