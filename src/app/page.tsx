import AdminDashboardFeatures from "../components/HomePage/AdminDashboardFeatures/AdminDashboardFeatures";
import ComparisonChart from "../components/HomePage/ComparisonChart/ComparisonChart";
import Features from "../components/HomePage/Features/Features";
import Hero from "../components/HomePage/Hero/Hero";
import HowItWorks from "../components/HomePage/HowItWorks/HowItWorks";
import OtherDashboards from "../components/HomePage/OtherDashboards/OtherDashboards";
import Outgrow from "../components/HomePage/Outgrow/Outgrow";
import ParallaxArea from "../components/HomePage/ParallaxArea/ParallaxArea";
import PricingPreview from "../components/HomePage/PricingPreview/PricingPreview";
import ProjectSection from "../components/HomePage/ProjectSection/ProjectSection";
import Solution from "../components/HomePage/Solution/Solution";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Outgrow />
      <Solution />
      <Features />
      <AdminDashboardFeatures />
      <OtherDashboards />
      <ProjectSection />
      <ParallaxArea />
      <PricingPreview />
      <ComparisonChart />
      <HowItWorks />
    </main>
  );
}
