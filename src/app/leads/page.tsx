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

export default function LeadsPage() {
  return (
    <main>
      <PageIntroHero
        src={Img1}
        sectionIntroText='Leads Tool'
        heading='Find your next client before your competitor does'
        headingAccent=''
        subheading='$125/month · 7 Day free trial · cold, warm & hot leads · Cancel anytime'
        copy='A lead generation tool built exclusively for black car operators. Hot leads from people actively requesting transportation. Warm leads from businesses signaling upcoming demand. Cold leads from the B2B accounts that will fill your calendar for years.'
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
