import LightBulbii from "@/components/shared/icons/LightBulbii/LightBulbii";
import PageIntroHero from "@/components/shared/PageIntroHero/PageIntroHero";

export default function LeadsPage() {
  return (
    <main>
      <PageIntroHero
        icon={<LightBulbii />}
        sectionIntroText='Leads Tool'
        heading='Find your next client'
        headingAccent='before your competitor does'
        subheading='$125/month · 7 Day free trial · cold, warm & hot leads · Cancel anytime'
        copy='A lead generation tool built exclusively for black car operators. Hot leads from people actively requesting transportation. Warm leads from businesses signaling upcoming demand. Cold leads from the B2B accounts that will fill your calendar for years.'
      />
    </main>
  );
}
