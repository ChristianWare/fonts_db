import AboutHero from "@/components/AboutPage/AboutHero/AboutHero";
import Approach from "@/components/AboutPage/Approach/Approach";
import ChrisAboutPage from "@/components/AboutPage/ChrisAboutPage/ChrisAboutPage";
import ThreeProducts from "@/components/AboutPage/ThreeProducts/ThreeProducts";
import AdminDashboardFeatures from "@/components/HomePage/AdminDashboardFeatures/AdminDashboardFeatures";
import ContactSection from "@/components/HomePage/ContactSection/ContactSection";
import Faq from "@/components/HomePage/Faq/Faq";
import ProjectSection from "@/components/HomePage/ProjectSection/ProjectSection";

export default function AboutPage() {
  return (
    <div>
      <AboutHero />
      <ChrisAboutPage />
      <Approach />
      <ThreeProducts />
      <AdminDashboardFeatures />
      <ProjectSection />
      <Faq />
      <ContactSection />
    </div>
  );
}
